const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { AppError } = require("../utils/errors");
const logger = require("../utils/logger");
const { emitRankingUpdate } = require("../socket/socket");

const prisma = new PrismaClient();
const VOTE_PRICE = 100;
const GENIUSPAY_BASE_URL = "https://pay.genius.ci/api/v1/merchant";
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
const PAYPAL_CURRENCY = process.env.PAYPAL_CURRENCY || "USD";
const PAYPAL_XAF_RATE = parseFloat(process.env.PAYPAL_XAF_RATE) || 650;

function amountToVotes(amount) {
  return Math.floor(amount / VOTE_PRICE);
}

async function findOrCreateVoter({ voterName, voterEmail, voterPhone }) {
  const email = voterEmail.toLowerCase().trim();
  const name = voterName.trim();
  const phone = voterPhone?.trim() || null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "ADMIN") {
      throw new AppError("Cette adresse email ne peut pas etre utilisee pour voter", 400);
    }

    return prisma.user.update({
      where: { id: existing.id },
      data: { name, phone },
    });
  }

  const passwordHash = await bcrypt.hash(uuidv4(), 10);

  return prisma.user.create({
    data: {
      email,
      name,
      phone,
      passwordHash,
      role: "USER",
    },
  });
}

async function initFapshi({ txRef, amount, userEmail, candidateName, votesCount }) {
  const response = await axios.post(
    "https://live.fapshi.com/initiate-pay",
    {
      amount,
      email: userEmail,
      redirectUrl: `${process.env.FRONTEND_URL}/vote/callback?tx_ref=${txRef}&provider=fapshi`,
      externalId: txRef,
      message: `${votesCount} vote(s) pour ${candidateName}`,
    },
    {
      headers: {
        apiuser: process.env.FAPSHI_API_USER,
        apikey: process.env.FAPSHI_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (response.data.statusCode !== 200 && !response.data.paymentLink) {
    throw new AppError(`Erreur Fapshi: ${response.data.message || "Inconnue"}`, 502);
  }

  return { paymentLink: response.data.paymentLink, transId: response.data.transId };
}

async function verifyFapshi(transId) {
  const response = await axios.get(`https://live.fapshi.com/payment-status/${transId}`, {
    headers: {
      apiuser: process.env.FAPSHI_API_USER,
      apikey: process.env.FAPSHI_API_KEY,
    },
  });

  return response.data;
}

async function getPayPalToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    throw new AppError("PayPal non configuré", 500);
  }

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (!response.data?.access_token) {
    throw new AppError("Impossible de générer le jeton PayPal", 500);
  }

  return response.data.access_token;
}

async function initPayPal({ txRef, amount, userEmail, userName, candidateName, votesCount }) {
  const token = await getPayPalToken();
  const value = (Math.max(100, amount) / PAYPAL_XAF_RATE).toFixed(2);

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value,
          },
          description: `${votesCount} vote(s) pour ${candidateName}`,
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/vote/callback?tx_ref=${txRef}&provider=paypal`,
        cancel_url: `${process.env.FRONTEND_URL}/vote/callback?tx_ref=${txRef}&status=cancelled`,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.data?.links) {
    throw new AppError("Impossible de démarrer le paiement PayPal", 502);
  }

  const approveLink = response.data.links.find((link) => link.rel === "approve")?.href;
  if (!approveLink) {
    throw new AppError("Impossible de récupérer le lien PayPal", 502);
  }

  return { paymentLink: approveLink, orderId: response.data.id };
}

async function verifyPayPal(orderId) {
  if (!orderId) {
    throw new AppError("Identifiant PayPal manquant", 400);
  }

  const token = await getPayPalToken();
  const response = await axios.get(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const orderStatus = response.data?.status;
  if (orderStatus === "COMPLETED") {
    return { success: true };
  }

  if (orderStatus === "APPROVED") {
    try {
      const capture = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const captureStatus = capture.data?.status;
      if (captureStatus === "COMPLETED") {
        return { success: true };
      }
    } catch (captureError) {
      if (captureError.response?.data?.name === "ORDER_ALREADY_CAPTURED") {
        return { success: true };
      }
      throw captureError;
    }
  }

  return { success: false, status: orderStatus };
}

async function initGeniusPay({ txRef, amount, userEmail, userName, candidateName, voterPhone, country }) {
  if (!process.env.GENIUSPAY_API_KEY || !process.env.GENIUSPAY_API_SECRET) {
    throw new AppError("Clés GeniusPay non configurées", 500);
  }

  const payload = {
    amount,
    currency: "XOF",
    description: `${candidateName} - ${amount.toLocaleString("fr-FR")} FCFA`,
    customer: {
      name: userName,
      email: userEmail,
      phone: voterPhone,
      country: country || "CI",
    },
    success_url: `${process.env.FRONTEND_URL}/vote/callback?tx_ref=${txRef}&provider=geniuspay&status=completed`,
    error_url: `${process.env.FRONTEND_URL}/vote/callback?tx_ref=${txRef}&provider=geniuspay&status=failed`,
    metadata: {
      candidateName,
      userEmail,
      txRef,
      country: country || "CI",
    },
  };

  const response = await axios.post(`${GENIUSPAY_BASE_URL}/payments`, payload, {
    headers: {
      "X-API-Key": process.env.GENIUSPAY_API_KEY,
      "X-API-Secret": process.env.GENIUSPAY_API_SECRET,
      "Content-Type": "application/json",
    },
  });

  if (!response.data?.success || !response.data?.data) {
    throw new AppError(`Erreur GeniusPay: ${response.data?.error?.message || "Réponse invalide"}`);
  }

  const data = response.data.data;
  const paymentLink = data.checkout_url || data.payment_url;
  if (!paymentLink) {
    throw new AppError("Impossible de récupérer le lien de paiement GeniusPay");
  }

  return {
    paymentLink,
    geniuspayReference: data.reference || data.id,
  };
}

async function verifyGeniusPay(externalReference) {
  if (!process.env.GENIUSPAY_API_KEY || !process.env.GENIUSPAY_API_SECRET) {
    throw new AppError("Clés GeniusPay non configurées", 500);
  }

  const response = await axios.get(`${GENIUSPAY_BASE_URL}/payments/${externalReference}`, {
    headers: {
      "X-API-Key": process.env.GENIUSPAY_API_KEY,
      "X-API-Secret": process.env.GENIUSPAY_API_SECRET,
      "Content-Type": "application/json",
    },
  });

  return response.data?.data || null;
}


async function initializePayment({ candidateId, amount, provider, country, voterName, voterEmail, voterPhone }) {
  const contest = await prisma.contest.findFirst({ where: { status: "OPEN" } });
  if (!contest) throw new AppError("Les votes sont actuellement fermes", 403);

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, status: "APPROVED" },
  });
  if (!candidate) throw new AppError("Candidat introuvable ou non approuve", 404);

  const votesCount = amountToVotes(amount);
  if (votesCount < 1) throw new AppError("Montant minimum : 100 FCFA", 400);

  const validProviders = ["fapshi", "paypal", "geniuspay"];
  if (!validProviders.includes(provider)) throw new AppError("Provider invalide", 400);

  const voter = await findOrCreateVoter({ voterName, voterEmail, voterPhone });
  const txRef = `MMM-${provider.toUpperCase()}-${uuidv4()}`;

  const payment = await prisma.payment.create({
    data: {
      userId: voter.id,
      candidateId,
      amount,
      votesCount,
      flutterwaveTxRef: txRef,
      status: "PENDING",
      metadata: {
        provider,
        country: country || "CI",
        candidateName: candidate.name,
        candidateType: candidate.type,
        voterName: voter.name,
        voterEmail: voter.email,
        voterPhone: voter.phone,
      },
    },
  });

  const params = {
    txRef,
    amount,
    userEmail: voter.email,
    userName: voter.name || voter.email,
    candidateName: candidate.name,
    votesCount,
    country,
  };

  let paymentLink = "";

  try {
    if (provider === "fapshi") {
      const result = await initFapshi(params);
      paymentLink = result.paymentLink;
      if (result.transId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { flutterwaveFlwRef: result.transId },
        });
      }
    } else if (provider === "paypal") {
      const result = await initPayPal(params);
      paymentLink = result.paymentLink;
      if (result.orderId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { flutterwaveFlwRef: result.orderId },
        });
      }
    } else if (provider === "geniuspay") {
      const result = await initGeniusPay({ ...params, voterPhone, country });
      paymentLink = result.paymentLink;
      if (result.geniuspayReference) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { flutterwaveFlwRef: result.geniuspayReference },
        });
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error(`[${provider}] init error:`, err.response?.data || err.message);
    throw new AppError(`Erreur lors de l'initialisation du paiement (${provider})`, 502);
  }

  logger.info(`Payment initialized: provider=${provider} txRef=${txRef} amount=${amount} votes=${votesCount}`);

  return {
    paymentId: payment.id,
    txRef,
    paymentLink,
    votesCount,
    amount,
    candidateName: candidate.name,
    provider,
  };
}

async function verifyPayment(txRef) {
  const payment = await prisma.payment.findUnique({ where: { flutterwaveTxRef: txRef } });
  if (!payment) throw new AppError("Transaction introuvable", 404);
  if (payment.status === "COMPLETED") {
    return {
      status: "COMPLETED",
      votesCount: payment.votesCount,
      message: "Votes deja credites",
    };
  }
  if (payment.status === "FAILED") {
    return { status: "FAILED", message: "Paiement echoue" };
  }

  const provider = payment.metadata?.provider || "fapshi";

  try {
    let success = false;

    if (provider === "fapshi") {
      const transId = payment.flutterwaveFlwRef;
      if (!transId) return { status: "PENDING", message: "En attente de confirmation" };
      const result = await verifyFapshi(transId);
      success = result.status === "SUCCESSFUL";
    } else if (provider === "paypal") {
      const orderId = payment.flutterwaveFlwRef;
      if (!orderId) return { status: "PENDING", message: "En attente PayPal" };
      const result = await verifyPayPal(orderId);
      success = result.success === true;
    } else if (provider === "geniuspay") {
      const externalReference = payment.flutterwaveFlwRef;
      if (!externalReference) return { status: "PENDING", message: "En attente de confirmation GeniusPay" };
      const result = await verifyGeniusPay(externalReference);
      success = result?.status === "completed";
    }

    if (success) {
      if (payment.status !== "PENDING") {
        return {
          status: payment.status,
          votesCount: payment.votesCount,
          message: "Deja traite",
        };
      }

      await creditVotes(payment);
      return {
        status: "COMPLETED",
        votesCount: payment.votesCount,
        message: "Votes credites avec succes !",
      };
    }

    return { status: "PENDING", message: "Paiement en attente de confirmation" };
  } catch (err) {
    logger.error("Verify error:", err.message);
    return { status: "PENDING", message: "Verification impossible pour l'instant" };
  }
}

async function processFapshiWebhook(body) {
  const { externalId: txRef, status, transId } = body;
  if (!txRef) return;

  const payment = await prisma.payment.findUnique({ where: { flutterwaveTxRef: txRef } });
  if (!payment || payment.webhookReceived || payment.status !== "PENDING") return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { webhookReceived: true, flutterwaveFlwRef: transId },
  });

  if (status === "SUCCESSFUL") {
    await creditVotes(payment);
    logger.info(`Fapshi webhook: votes credited txRef=${txRef}`);
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }
}

async function creditVotes(payment) {
  const credited = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "COMPLETED" },
    });

    if (result.count === 0) {
      return false;
    }

    await tx.vote.create({
      data: {
        userId: payment.userId,
        candidateId: payment.candidateId,
        count: payment.votesCount,
        paymentId: payment.id,
      },
    });
    await tx.candidate.update({
      where: { id: payment.candidateId },
        data: { totalVotes: { increment: payment.votesCount } },
    });

    return true;
  });

  if (credited) {
    await emitRankingUpdate();
  }

  return credited;
}

async function getUserPayments(userId, page, limit) {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where: { userId } }),
  ]);

  return { payments, total, page, totalPages: Math.ceil(total / limit) };
}

module.exports = {
  initializePayment,
  verifyPayment,
  processFapshiWebhook,
  getUserPayments,
  creditVotes,
};
