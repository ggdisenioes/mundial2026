"use client";
import { useT } from "@/contexts/LangContext";

export default function LangSelector() {
  const { lang, setLang } = useT();
  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
      <button
        onClick={() => setLang("es")}
        title="Español (España)"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          lang === "es" ? "bg-tw-green text-tw-navy shadow-sm" : "text-white/60 hover:text-white"
        }`}
      >
        🇪🇸 <span className="hidden sm:inline">ES</span>
      </button>
      <button
        onClick={() => setLang("en")}
        title="English (UK)"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          lang === "en" ? "bg-tw-green text-tw-navy shadow-sm" : "text-white/60 hover:text-white"
        }`}
      >
        🇬🇧 <span className="hidden sm:inline">EN</span>
      </button>
    </div>
  );
}
