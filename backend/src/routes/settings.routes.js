const express = require("express");
const settingsService = require("../services/settings.service");
const { rankingRateLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Public : état de la promo "votes doubles" (pour afficher un badge côté front).
router.get("/double-votes", rankingRateLimiter, async (req, res, next) => {
  try {
    const enabled = await settingsService.getDoubleVotes();
    res.json({ success: true, data: { enabled } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
