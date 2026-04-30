const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { AppError } = require("../utils/errors");

const prisma = new PrismaClient();
const ACCESS_EXPIRY = "2h";
const REFRESH_EXPIRY = "7d";

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });

  return { accessToken, refreshToken };
}

function buildAdminUser() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const displayName = (process.env.ADMIN_DISPLAY_NAME || "Administrateur").trim();

  return {
    id: "env-admin",
    name: displayName,
    email,
    role: "ADMIN",
  };
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

  if (!isValid) {
    throw new AppError("Identifiants admin invalides", 401);
  }

  const user = buildAdminUser();
  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  return { user, ...tokens };
}

async function registerUser({ name, email, password, phone }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError("Cet email est déjà utilisé", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone?.trim() || null,
      role: "USER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    }
  });

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  return { user, ...tokens };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Email ou mot de passe invalide", 401);
  }

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  return { user: publicUser, ...tokens };
}

async function getMe(userPayload) {
  if (!userPayload) {
    throw new AppError("Utilisateur introuvable", 404);
  }

  if (userPayload.role === "ADMIN" && userPayload.id === "env-admin") {
    return buildAdminUser();
  }

  const user = await prisma.user.findUnique({
    where: { id: userPayload.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    }
  });

  if (!user) {
    throw new AppError("Utilisateur introuvable", 404);
  }

  return user;
}

async function refresh(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (payload.role === "ADMIN" && payload.id === "env-admin") {
      const user = buildAdminUser();
      return generateTokens({ id: user.id, email: user.email, role: user.role });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) throw new AppError("Token invalide", 401);

    return generateTokens({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Token invalide ou expiré", 401);
  }
}

module.exports = { loginAdmin, registerUser, loginUser, getMe, refresh };
