const prisma = require("../utils/prismaClient");
const candidateService = require("../services/candidate.service");
const { validationResult } = require("express-validator");


class CandidateController {

  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Photo obligatoire" });
      }
      const data = {
        ...req.body,
        photoPath: req.file.path || req.file.secure_url || "",
        instagram: req.body.instagram,
        tiktok: req.body.tiktok,
        snap: req.body.snap,
        whatsappFan: req.body.whatsappFan,
        phone: req.body.phone,
        userId: req.user?.id,
      };
      const candidate = await candidateService.createCandidate(data);
      res.status(201).json({
        success: true,
        message: "Candidature soumise, en attente de validation",
        data: candidate,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const { type, page = 1, limit = 20 } = req.query;
      const result = await candidateService.getAllApproved({ type, page: +page, limit: +limit });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const candidate = await candidateService.getById(req.params.id);
      if (!candidate) return res.status(404).json({ success: false, message: "Candidat introuvable" });
      res.json({ success: true, data: candidate });
    } catch (err) {
      next(err);
    }
  }

  async getTopCandidates(req, res, next) {
    try {
      const { type, limit = 10 } = req.query;
      const candidates = await candidateService.getTop({ type, limit: +limit });
      res.json({ success: true, data: candidates });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/candidates/:id/like — incrémenter totalLikes
  async like(req, res, next) {
    try {
      const { id } = req.params;
      const candidate = await prisma.candidate.findUnique({ where: { id } });
      if (!candidate) {
        return res.status(404).json({ success: false, message: "Candidat introuvable" });
      }
      const updated = await prisma.candidate.update({
        where: { id },
        data: { totalLikes: { increment: 1 } },
        select: { id: true, totalLikes: true },
      });
      res.json({ success: true, data: { totalLikes: updated.totalLikes } });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/candidates/:id/like — décrémenter totalLikes (min 0)
  async unlike(req, res, next) {
    try {
      const { id } = req.params;
      const candidate = await prisma.candidate.findUnique({ where: { id } });
      if (!candidate) {
        return res.status(404).json({ success: false, message: "Candidat introuvable" });
      }
      const updated = await prisma.candidate.update({
        where: { id },
        data: {
          totalLikes: { decrement: candidate.totalLikes > 0 ? 1 : 0 },
        },
        select: { id: true, totalLikes: true },
      });
      res.json({ success: true, data: { totalLikes: updated.totalLikes } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CandidateController();
