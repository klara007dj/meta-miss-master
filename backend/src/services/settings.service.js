const prisma = require("../utils/prismaClient");

// Clés de réseaux sociaux autorisées (whitelist). Toute autre clé est ignorée.
const SOCIAL_KEYS = [
  "whatsappGroup",
  "whatsappChannel",
  "tiktok",
  "youtube",
  "snapchat",
  "telegram",
];

const SINGLETON_ID = "site-settings";

// Retourne toujours les 6 clés (chaîne vide si non définie).
async function getSocialLinks() {
  const row = await prisma.siteSetting.findUnique({ where: { id: SINGLETON_ID } });
  const data = (row && row.data) || {};
  const out = {};
  for (const k of SOCIAL_KEYS) {
    out[k] = typeof data[k] === "string" ? data[k] : "";
  }
  return out;
}

// Met à jour les liens : on ne garde que les clés autorisées, valeurs en string
// tronquées à 500 caractères. Renvoie l'état final normalisé.
async function updateSocialLinks(input = {}) {
  const clean = {};
  for (const k of SOCIAL_KEYS) {
    const v = input[k];
    clean[k] = typeof v === "string" ? v.trim().slice(0, 500) : "";
  }

  await prisma.siteSetting.upsert({
    where: { id: SINGLETON_ID },
    update: { data: clean },
    create: { id: SINGLETON_ID, data: clean },
  });

  return getSocialLinks();
}

module.exports = { getSocialLinks, updateSocialLinks, SOCIAL_KEYS };
