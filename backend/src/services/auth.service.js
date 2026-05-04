const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { AppError } = require("../utils/errors");

const prisma = new PrismaClient();
// Admin session: 7 jours
const ACCESS_EXPIRY = "7d";
const REFRESH_EXPIRY = "30d";
// User session: 7 jours
const USER_ACCESS_EXPIRY = "7d";
const USER_REFRESH_EXPIRY = "30d";

function generateTokens(payload, isAdmin = false) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: isAdmin ? ACCESS_EXPIRY : USER_ACCESS_EXPIRY,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: isAdmin ? REFRESH_EXPIRY : USER_REFRESH_EXPIRY,
  });
  return { accessToken, refreshToken };
}

function buildAdminUser() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const displayName = (process.env.ADMIN_DISPLAY_NAME || "Administrateur").trim();
  return { id: "env-admin", name: displayName, email, role: "ADMIN" };
}

function getAdminConfig() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim();
  const propertyNumber = (process.env.ADMIN_PROPERTY_NUMBER || "").trim();
  const motherFullName = (process.env.ADMIN_MOTHER_FULL_NAME || "").trim().toLowerCase();

  if (!email || !password || !propertyNumber || !motherFullName) {
    throw new AppError("Variables admin manquantes sur le serveur", 500);
  }
  return { email, password, propertyNumber, motherFullName };
}

async function loginAdmin({ email, password, propertyNumber, motherFullName }) {
  const config = getAdminConfig();

  const isValid =
    email.toLowerCase().trim() === config.email &&
    password === config.password &&
    propertyNumber.trim() === config.propertyNumber &&
    motherFullName.toLowerCase().trim() === config.motherFullName;

  if (!isValid) throw new AppError("Identifiants admin invalides", 401);

  const user = buildAdminUser();
  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role }, true);
  return { user, ...tokens };
}

async function registerUser({ name, email, password, phone }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new AppError("Cet email est déjà utilisé", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone?.trim() || null,
      role: "USER",
    },
  });

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    ...tokens,
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) throw new AppError("Email ou mot de passe incorrect", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Email ou mot de passe incorrect", 401);

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar },
    ...tokens,
  };
}

async function refreshTokens(token) {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Refresh token invalide", 401);
  }

  if (payload.role === "ADMIN") {
    const user = buildAdminUser();
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role }, true);
    return { user, ...tokens };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw new AppError("Utilisateur introuvable", 404);

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    ...tokens,
  };
}

async function getMe(userId, role) {
  if (role === "ADMIN") return buildAdminUser();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Utilisateur introuvable", 404);
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar };
}

module.exports = { loginAdmin, registerUser, loginUser, refreshTokens, getMe };
