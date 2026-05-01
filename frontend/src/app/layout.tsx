import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ThemeProvider from "@/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "Meta Miss Master 2025",
  description: "Votez pour vos candidats préférés au concours Meta Miss Master 2025. Résultats en direct.",
  keywords: ["miss master", "concours", "vote", "cameroun", "IAI"],
  openGraph: {
    title: "Meta Miss Master 2025",
    description: "Votez maintenant · Résultats en direct",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
