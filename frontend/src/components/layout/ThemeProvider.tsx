"use client";
import { createContext, useContext, ReactNode } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });
export const useThemeContext = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}
