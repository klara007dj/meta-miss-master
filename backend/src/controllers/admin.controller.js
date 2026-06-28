const prisma = require("../utils/prismaClient");
const adminService = require("../services/admin.service");
const candidateService = require("../services/candidate.service");
const contestService = require("../services/contest.service");
const settingsService = require("../services/settings.service");

class AdminController {
  // ── Candidates ──────────────────────────────────────────

  async getAllCandidates(req, res, next) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await adminService.getAllCandidates({ status, page: +page, limit: +limit });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  // Créer un candidat côté admin (avec photo Cloudinary)
  async createCandidate(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Photo obligatoire" });
      }
      const data = {
        name: req.body.name,
        type: req.body.type,
        age: req.body.age,
        city: req.body.city,
        bio: req.body.bio || "",
        instagram: req.body.instagram || null,
        tiktok: req.body.tiktok || null,
        snap: req.body.snap || null,
        whatsappFan: req.body.whatsappFan || null,
        phone: req.body.phone || null,
        photoPath: req.file.path || req.file.secure_url || "",
        userId: null,
      };
      // Si un statut est fourni on l'applique directement (admin peut créer APPROVED)
      const candidate = await candidateService.createCandidate(data);
      if (req.body.status && req.body.status !== "PENDING") {
        await adminService.updateCandidate(candidate.id, { status: req.body.status });
      }
      res.status(201).json({ success: true, message: "Candidat créé avec succès", data: candidate });
    } catch (err) { next(err); }
  }

  async approveCandidate(req, res, next) {
    try {
      const candidate = await adminService.approveCandidate(req.params.id);
      res.json({ success: true, message: "Candidat approuvé", data: candidate });
    } catch (err) { next(err); }
  }

  async rejectCandidate(req, res, next) {
    try {
      const { reason } = req.body;
      const candidate = await adminService.rejectCandidate(req.params.id, reason);
      res.json({ success: true, message: "Candidat rejeté", data: candidate });
    } catch (err) { next(err); }
  }

  // Modifier un candidat — supporte maintenant le changement de photo
  async updateCandidate(req, res, next) {
    try {
      const updateData = { ...req.body };
      // Si une nouvelle photo a été uploadée via Cloudinary, on met à jour l'URL
      if (req.file) {
        updateData.photoUrl = req.file.path || req.file.secure_url;
      }
      const candidate = await adminService.updateCandidate(req.params.id, updateData);
      res.json({ success: true, message: "Candidat mis à jour", data: candidate });
    } catch (err) { next(err); }
  }

  async deleteCandidate(req, res, next) {
    try {
      await adminService.deleteCandidate(req.params.id);
      res.json({ success: true, message: "Candidat supprimé" });
    } catch (err) { next(err); }
  }

  // ── Payments ─────────────────────────────────────────────

  async getAllPayments(req, res, next) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await adminService.getAllPayments({ status, page: +page, limit: +limit });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async refundPayment(req, res, next) {
    try {
      const result = await adminService.refundPayment(req.params.id);
      res.json({ success: true, message: "Remboursement initié", data: result });
    } catch (err) { next(err); }
  }

  // ── Contest ──────────────────────────────────────────────

  async closeVotes(req, res, next) {
    try {
      const contest = await contestService.closeContest(req.params.id);
      res.json({ success: true, message: "Votes fermés", data: contest });
    } catch (err) { next(err); }
  }

  async openVotes(req, res, next) {
    try {
      const contest = await contestService.openContest(req.params.id);
      res.json({ success: true, message: "Votes ouverts", data: contest });
    } catch (err) { next(err); }
  }

  async getContests(req, res, next) {
    try {
      const contests = await contestService.getAll();
      res.json({ success: true, data: contests });
    } catch (err) { next(err); }
  }

  async createContest(req, res, next) {
    try {
      const contest = await contestService.create(req.body);
      res.status(201).json({ success: true, data: contest });
    } catch (err) { next(err); }
  }

  async updateContest(req, res, next) {
    try {
      const id = req.params.id; // CUID string, pas un entier
      const contest = await contestService.updateContest(id, req.body);
      res.json({ success: true, data: contest });
    } catch (err) { next(err); }
  }

  // ── Dashboard stats ──────────────────────────────────────

  async getDashboardStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  }

  // ── Users ────────────────────────────────────────────────

  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await adminService.getAllUsers({ page: +page, limit: +limit });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async deleteUser(req, res, next) {
    try {

      const id = req.params.id; // CUID string
      if (req.user.id === id) return res.status(400).json({ success: false, message: "Vous ne pouvez pas vous supprimer vous-même." });
      await prisma.user.delete({ where: { id } });
      res.json({ success: true, message: "Utilisateur supprimé" });
    } catch (err) { next(err); }
  }

  async updateUser(req, res, next) {
    try {

      const id = req.params.id; // CUID string
      const { name, email, role } = req.body;
      const user = await prisma.user.update({
        where: { id },
        data: { ...(name && { name }), ...(email && { email }), ...(role && { role }) },
      });
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }

  // ── Fraud: delete votes ──────────────────────────────────

  async deleteVote(req, res, next) {
    try {
      await adminService.deleteVote(req.params.id);
      res.json({ success: true, message: "Vote supprimé (fraude)" });
    } catch (err) { next(err); }
  }

  // ── Réseaux sociaux du site ──────────────────────────────
  async getSocialLinks(req, res, next) {
    try {
      const data = await settingsService.getSocialLinks();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async updateSocialLinks(req, res, next) {
    try {
      const data = await settingsService.updateSocialLinks(req.body || {});
      res.json({ success: true, message: "Réseaux sociaux mis à jour", data });
    } catch (err) { next(err); }
  }

  // ── Reset all votes ──────────────────────────────────────
  async resetVotes(req, res, next) {
    try {
      // Garde-fou : l'action est destructive, on exige une confirmation explicite.
      if (req.body?.confirm !== true) {
        return res.status(400).json({ success: false, message: "Confirmation requise (confirm: true)" });
      }
      const result = await adminService.resetAllVotes();
      res.json({
        success: true,
        message: `Tous les votes ont été remis à zéro (${result.deletedVotes} vote(s) supprimé(s))`,
        data: result,
      });
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();
