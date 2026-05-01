const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
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

// ─── VOTER ────────────────────────────────────────────────────────────────────

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
    data: { email, name, phone, passwordHash, role: "USER" },
  });
}

// ─── FAPSHI ───────────────────────────────────────────────────────────────────

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
  const response = await axios.get(
    `https://live.fapshi.com/payment-status/${transId}`,
    {
      headers: {
        apiuser: process.env.FAPSHI_API_USER,
        apikey: process.env.FAPSHI_API_KEY,
      },
    },
  );
  return response.data;
}

// ─── PAYPAL ───────────────────────────────────────────────────────────────────

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
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  if (!response.data?.access_token) {
    throw new AppError("Impossible de générer le jeton PayPal", 500);
  }

  return response.data.access_token;
}

async function initPayPal({ txRef, amount, candidateName, votesCount }) {
  const token = await getPayPalToken();
  const value = (Math.max(100, amount) / PAYPAL_XAF_RATE).toFixed(2);

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: PAYPAL_CURRENCY, value },
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
  if (!orderId) throw new AppError("Identifiant PayPal manquant", 400);

  const token = await getPayPalToken();
  const response = await axios.get(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const orderStatus = response.data?.status;
  if (orderStatus === "COMPLETED") return { success: true };

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
      if (capture.data?.status === "COMPLETED") return { success: true };
    } catch (captureError) {
      if (captureError.response?.data?.name === "ORDER_ALREADY_CAPTURED") {
        return { success: true };
      }
      throw captureError;
    }
  }

  return { success: false, status: orderStatus };
}

// ─── GENIUSPAY ────────────────────────────────────────────────────────────────

async function initGeniusPay({ txRef, amount, userEmail, userName, candidateName, voterPhone, country }) {
  if (!process.env.GENIUSPAY_API_KEY || !process.env.GENIUSPAY_API_SECRET) {
    throw new AppError("Clés GeniusPay non configurées", 500);
  }

  if (amount < 200) {
    throw new AppError("Montant minimum pour GeniusPay : 200 FCFA (2 votes)", 400);
  }

  const payload = {
    amount,
    description: `${candidateName} - ${amount.toLocaleString("fr-FR")} FCFA`,
    customer: {
      name: userName,
      email: userEmail,
      ...(voterPhone && { phone: voterPhone }),
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

  let response;
  try {
    response = await axios.post(`${GENIUSPAY_BASE_URL}/payments`, payload, {
      headers: {
        "X-API-Key": process.env.GENIUSPAY_API_KEY,
        "X-API-Secret": process.env.GENIUSPAY_API_SECRET,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    logger.error("GeniusPay init error:", err.response?.data || err.message);
    throw new AppError(
      `Erreur GeniusPay: ${err.response?.data?.error?.message || err.message}`,
      502
    );
  }

  if (!response.data?.success || !response.data?.data) {
    logger.error("GeniusPay bad response:", response.data);
    throw new AppError(
      `Erreur GeniusPay: ${response.data?.error?.message || "Réponse invalide"}`,
      502
    );
  }

  const data = response.data.data;
  const paymentLink = data.checkout_url || data.payment_url;

  if (!paymentLink) {
    logger.error("GeniusPay no payment link:", data);
    throw new AppError("Impossible de récupérer le lien de paiement GeniusPay", 502);
  }

  logger.info(`GeniusPay payment created: ref=${data.reference || data.id}`);

  return {
    paymentLink,
    geniuspayReference: data.reference || String(data.id),
  };
}

async function verifyGeniusPay(externalReference) {
  if (!process.env.GENIUSPAY_API_KEY || !process.env.GENIUSPAY_API_SECRET) {
    throw new AppError("Clés GeniusPay non configurées", 500);
  }

  try {
    const response = await axios.get(
      `${GENIUSPAY_BASE_URL}/payments/${externalReference}`,
      {
        headers: {
          "X-API-Key": process.env.GENIUSPAY_API_KEY,
          "X-API-Secret": process.env.GENIUSPAY_API_SECRET,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data?.data || null;
  } catch (err) {
    logger.error("GeniusPay verify error:", err.response?.data || err.message);
    return null;
  }
}

// ─── GENIUSPAY SIGNATURE ──────────────────────────────────────────────────────

function verifyGeniusPaySignature({ signature, timestamp, body }) {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("GENIUSPAY_WEBHOOK_SECRET non configuré");
    return false;
  }

  try {
    // Le body est un Buffer (express.raw) — on le convertit en string
    const rawBody = Buffer.isBuffer(body) ? body.toString("utf8") : JSON.stringify(body);

    // Format GeniusPay : HMAC-SHA256(timestamp + "." + json_payload, secret)
    const data = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("hex");

    // Comparaison à temps constant pour éviter les timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch (err) {
    logger.error("GeniusPay signature verification error:", err.message);
    return false;
  }
}

// ─── GENIUSPAY WEBHOOK ────────────────────────────────────────────────────────

async function processGeniusPayWebhook(body) {
  const { event, data: eventData } = body;

  if (!event || !eventData) {
    logger.warn("GeniusPay webhook: body invalide", body);
    return;
  }

  logger.info(`GeniusPay webhook event: ${event}`);

  // On traite uniquement payment.success
  if (event !== "payment.success") return;

  const txRef = eventData?.metadata?.txRef;
  if (!txRef) {
    logger.warn("GeniusPay webhook: txRef manquant dans metadata", eventData);
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { flutterwaveTxRef: txRef },
  });

  if (!payment) {
    logger.warn(`GeniusPay webhook: paiement introuvable pour txRef=${txRef}`);
    return;
  }

  if (payment.webhookReceived || payment.status !== "PENDING") {
    logger.info(`GeniusPay webhook: paiement déjà traité txRef=${txRef}`);
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      webhookReceived: true,
      flutterwaveFlwRef: eventData.reference || String(eventData.id),
    },
  });

  if (eventData.status === "completed") {
    await creditVotes(payment);
    logger.info(`GeniusPay webhook: votes crédités txRef=${txRef} votes=${payment.votesCount}`);
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    logger.warn(`GeniusPay webhook: paiement échoué txRef=${txRef} status=${eventData.status}`);
  }
}

// ─── INITIALIZE PAYMENT ───────────────────────────────────────────────────────

async function initializePayment({ candidateId, amount, provider, country, voterName, voterEmail, voterPhone }) {
  const contest = await prisma.contest.findFirst({ where: { status: "OPEN" } });
  if (!contest) throw new AppError("Les votes sont actuellement fermés", 403);

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, status: "APPROVED" },
  });
  if (!candidate) throw new AppError("Candidat introuvable ou non approuvé", 404);

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
    voterPhone: voter.phone,
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
      const result = await initGeniusPay(params);
      paymentLink = result.paymentLink;
      if (result.geniuspayReference) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { flutterwaveFlwRef: result.geniuspayReference },
        });
      }
    }
  } catch (err) {
    // Marquer comme échoué si l'init plante
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
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

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────

async function verifyPayment(txRef) {
  const payment = await prisma.payment.findUnique({
    where: { flutterwaveTxRef: txRef },
  });
  if (!payment) throw new AppError("Transaction introuvable", 404);

  if (payment.status === "COMPLETED") {
    return {
      status: "COMPLETED",
      votesCount: payment.votesCount,
      message: "Votes déjà crédités",
    };
  }

  if (payment.status === "FAILED") {
    return { status: "FAILED", message: "Paiement échoué" };
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
      if (!externalReference) return { status: "PENDING", message: "En attente GeniusPay" };
      const result = await verifyGeniusPay(externalReference);
      success = result?.status === "completed";
    }

    if (success) {
      if (payment.status !== "PENDING") {
        return {
          status: payment.status,
          votesCount: payment.votesCount,
          message: "Déjà traité",
        };
      }
      await creditVotes(payment);
      return {
        status: "COMPLETED",
        votesCount: payment.votesCount,
        message: "Votes crédités avec succès !",
      };
    }

    return { status: "PENDING", message: "Paiement en attente de confirmation" };
  } catch (err) {
    logger.error("Verify error:", err.message);
    return { status: "PENDING", message: "Vérification impossible pour l'instant" };
  }
}

// ─── FAPSHI WEBHOOK ───────────────────────────────────────────────────────────

async function processFapshiWebhook(body) {
  const { externalId: txRef, status, transId } = body;
  if (!txRef) return;

  const payment = await prisma.payment.findUnique({
    where: { flutterwaveTxRef: txRef },
  });
  if (!payment || payment.webhookReceived || payment.status !== "PENDING") return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { webhookReceived: true, flutterwaveFlwRef: transId },
  });

  if (status === "SUCCESSFUL") {
    await creditVotes(payment);
    logger.info(`Fapshi webhook: votes crédités txRef=${txRef}`);
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
  }
}

// ─── CREDIT VOTES ─────────────────────────────────────────────────────────────

async function creditVotes(payment) {
  const credited = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "COMPLETED" },
    });

    if (result.count === 0) return false;

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

// ─── USER PAYMENTS ────────────────────────────────────────────────────────────

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
  processGeniusPayWebhook,
  verifyGeniusPaySignature,
  getUserPayments,
  creditVotes,
};
