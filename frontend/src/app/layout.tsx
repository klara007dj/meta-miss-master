import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Meta Miss Master",
  description: "Votez pour vos candidats préférés — Meta Miss Master 2025",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="app-container">
          {children}
        </div>
        <Toaster position="top-center" toastOptions={{
          style: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "0.85rem",
            borderRadius: "10px",
            background: "#111827",
            color: "#fff",
          },
          success: { iconTheme: { primary: "#2563EB", secondary: "#fff" } },
        }} />
      </body>
    </html>
  );
}
