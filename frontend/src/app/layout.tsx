import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ThemeProvider from "@/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "MetaMiss Master 2025",
  description: "Votez pour vos candidats préférés au concours MetaMiss Master 2025. Résultats en direct.",
  keywords: ["miss master", "concours", "vote", "cameroun"],

  openGraph: {
    title: "MetaMiss Master 2025",
    description: "🗳️ Votez pour vos candidats préférés · Résultats en direct",
    url: "https://meta-miss-master.vercel.app",
    siteName: "MetaMiss Master 2025",
    images: [
      {
        url: "https://meta-miss-master.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "MetaMiss Master 2025 — Élégance · Confiance · Excellence",
      },
    ],
    type: "website",
    locale: "fr_FR",
  },

  twitter: {
    card: "summary_large_image",
    title: "MetaMiss Master 2025",
    description: "🗳️ Votez pour vos candidats préférés · Résultats en direct",
    images: ["https://meta-miss-master.vercel.app/og-image.png"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="app-container">
            {children}
          </div>
          <Toaster position="top-center" toastOptions={{
            style: {
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "0.85rem",
              borderRadius: "10px",
              background: "var(--bg-card)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            },
            success: { iconTheme: { primary: "#2563EB", secondary: "#fff" } },
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
