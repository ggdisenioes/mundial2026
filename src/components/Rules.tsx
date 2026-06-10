"use client";
import { useT } from "@/contexts/LangContext";

export default function Rules() {
  const { t } = useT();
  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.rulesTitle}</h2>

      {[
        { title: t.p1Title, color: "text-emerald-700", items: [t.p1r1, t.p1r2] },
        { title: t.p2Title, color: "text-blue-700",    items: [t.p2r1, t.p2r2] },
      ].map(({ title, color, items }) => (
        <section key={title} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-tw-grey/20">
          <h3 className={`font-bold text-base sm:text-lg mb-3 ${color}`}>{title}</h3>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm sm:text-base text-tw-navy">
                <span className="text-tw-green mt-0.5 shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-tw-grey/20">
        <h3 className="font-bold text-base sm:text-lg mb-4 text-purple-700">{t.p3Title}</h3>
        <div className="divide-y divide-tw-light">
          {[
            [t.p3Champion, "50 pts"], [t.p3Runner,   "30 pts"],
            [t.p3Semis,    "15 pts"], [t.p3Quarters, "6 pts"],
            [t.p3R16,      "3 pts"],  [t.p3R32,      "2 pts"],
          ].map(([label, pts]) => (
            <div key={label} className="flex justify-between items-center py-2.5">
              <span className="text-sm sm:text-base text-tw-navy">{label}</span>
              <strong className="text-sm sm:text-base text-tw-navy font-extrabold">{pts}</strong>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs sm:text-sm text-tw-grey">{t.p3Note}</p>
      </section>

      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-tw-grey/20">
        <h3 className="font-bold text-base sm:text-lg mb-3 text-orange-600">{t.p4Title}</h3>
        <ul className="space-y-2">
          {[t.p4r1, t.p4r2, t.p4r3, t.p4r4].map(item => (
            <li key={item} className="text-sm sm:text-base text-tw-navy flex gap-2">
              <span className="text-tw-green mt-0.5 shrink-0">•</span>{item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
