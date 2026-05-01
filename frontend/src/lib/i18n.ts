export type Lang = "fr" | "en";

export const translations = {
  fr: {
    // Nav
    home: "Accueil",
    categories: "Catégories",
    vote: "Voter",
    results: "Résultats",
    profile: "Profil",
    // Auth
    login: "Se connecter",
    register: "S'inscrire",
    fullName: "Nom complet",
    email: "Adresse email",
    password: "Mot de passe",
    phone: "Téléphone",
    selectLanguage: "Langue",
    loginTitle: "Bon retour !",
    registerTitle: "Créer un compte",
    alreadyAccount: "Déjà un compte ?",
    noAccount: "Pas encore de compte ?",
    // Profile
    myVotes: "Mes votes",
    favorites: "Favoris",
    settings: "Paramètres",
    logout: "Déconnexion",
    logoutConfirm: "Se déconnecter ?",
    logoutDesc: "Vous serez redirigé vers la page d'accueil.",
    confirm: "Confirmer",
    cancel: "Annuler",
    submitCandidacy: "Soumettre ma candidature",
    // Settings
    darkMode: "Mode sombre",
    language: "Langue",
    appearance: "Apparence",
    // Support
    support: "Support",
    supportSubtitle: "Besoin d'aide ? Contactez-nous",
    contactSupport: "Contacter le support",
    joinGroup: "Rejoindre le groupe WhatsApp",
    // Candidates
    voteFor: "Voter pour",
    totalVotes: "votes au total",
    likes: "J'aime",
    noFavorites: "Aucun favori pour l'instant",
    noFavoritesDesc: "Les candidats que vous aimez apparaîtront ici.",
    // Misc
    loading: "Chargement...",
    error: "Une erreur est survenue",
  },
  en: {
    // Nav
    home: "Home",
    categories: "Categories",
    vote: "Vote",
    results: "Results",
    profile: "Profile",
    // Auth
    login: "Sign in",
    register: "Sign up",
    fullName: "Full name",
    email: "Email address",
    password: "Password",
    phone: "Phone number",
    selectLanguage: "Language",
    loginTitle: "Welcome back!",
    registerTitle: "Create an account",
    alreadyAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    // Profile
    myVotes: "My votes",
    favorites: "Favorites",
    settings: "Settings",
    logout: "Log out",
    logoutConfirm: "Log out?",
    logoutDesc: "You will be redirected to the home page.",
    confirm: "Confirm",
    cancel: "Cancel",
    submitCandidacy: "Submit my candidacy",
    // Settings
    darkMode: "Dark mode",
    language: "Language",
    appearance: "Appearance",
    // Support
    support: "Support",
    supportSubtitle: "Need help? Contact us",
    contactSupport: "Contact support",
    joinGroup: "Join WhatsApp group",
    // Candidates
    voteFor: "Vote for",
    totalVotes: "total votes",
    likes: "Likes",
    noFavorites: "No favorites yet",
    noFavoritesDesc: "Candidates you like will appear here.",
    // Misc
    loading: "Loading...",
    error: "An error occurred",
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;
