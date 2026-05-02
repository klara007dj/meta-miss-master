const rateLimit = require("express-rate-limit");

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: "Trop de requêtes. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Trop de tentatives de connexion. Réessayez plus tard." },
});

const paymentRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    const email = typeof req.body?.voterEmail === "string" ? req.body.voterEmail.trim().toLowerCase() : "";
    const candidateId = typeof req.body?.candidateId === "string" ? req.body.candidateId.trim() : "";
    return `${req.ip}:${email}:${candidateId}`;
  },
  message: { success: false, message: "Veuillez attendre 2 minutes avant de relancer un vote pour ce candidat." },
  skipSuccessfulRequests: false,
});

module.exports = { globalRateLimiter, authRateLimiter, paymentRateLimiter };
