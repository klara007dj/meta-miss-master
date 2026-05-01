"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, type Lang } from "@/lib/i18n";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof translations.fr;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "fr",
      t: translations.fr,
      setLang: (lang) =>
        set({ lang, t: translations[lang] }),
    }),
    { name: "mmm-lang" }
  )
);

// Hook raccourci — utiliser dans les composants
export function useT() {
  return useLangStore((s) => s.t);
}
