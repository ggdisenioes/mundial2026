"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { T, type Lang, type Translations } from "@/lib/translations";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const Ctx = createContext<LangCtx>({ lang: "es", setLang: () => {}, t: T.es });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "es" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  return (
    <Ctx.Provider value={{ lang, setLang, t: T[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export const useT = () => useContext(Ctx);
