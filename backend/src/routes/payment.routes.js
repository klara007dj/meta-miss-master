const express = require("express");
const { body } = require("express-validator");
const paymentController = require("../controllers/payment.controller");
const { authenticate } = require("../middlewares/auth");
const { paymentRateLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Webhooks — raw body obligatoire pour la vérification de signature
router.post(
  "/webhook/fapshi",
  express.raw({ type: "*/*" }),
  paymentController.webhookFapshi
);

router.post(
  "/webhook/geniuspay",
  express.raw({ type: "*/*" }),
  paymentController.webhookGeniusPay
);

// Initialize payment
router.post(
  "/initialize",
  paymentRateLimiter,
  [
    body("candidateId").notEmpty().withMessage("Candidat requis"),
    body("amount").isInt({ min: 100 }).withMessage("Montant minimum 100 FCFA"),
    body("provider").isIn(["fapshi", "paypal", "geniuspay"]).withMessage("Provider invalide"),
    body("country").optional().trim().isLength({ min: 2, max: 60 }).withMessage("Pays invalide"),
    body("voterName").trim().isLength({ min: 2, max: 100 }).withMessage("Nom requis"),
    body("voterEmail").isEmail().normalizeEmail().withMessage("Email requis"),
    body("voterPhone")
      .optional()
      .trim()
      .isLength({ min: 6, max: 30 })
      .withMessage("Téléphone invalide"),
  ],
  paymentController.initialize,
);

router.get("/verify/:txRef", paymentController.verify);

router.use(authenticate);
router.get("/history", paymentController.history);

module.exports = router;
