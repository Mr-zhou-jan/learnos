"use client";
import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const s = localStorage.getItem("learnos_theme");
    const d = s === "dark";
    document.documentElement.setAttribute("data-theme", d ? "dark" : "light");
    setDark(d);
  }, []);
  const toggle = () => {
    const n = !dark; setDark(n);
    document.documentElement.setAttribute("data-theme", n ? "dark" : "light");
    localStorage.setItem("learnos_theme", n ? "dark" : "light");
  };
  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}
