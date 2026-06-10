import * as XLSX from "xlsx";
import type { ParticipantPicks } from "@/types";

const norm = (s: unknown) =>
  String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export interface ParsedParticipant {
  name: string;
  picks: ParticipantPicks;
}

export function parseWorkbook(buffer: ArrayBuffer, fallbackName: string): ParsedParticipant[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const out: ParsedParticipant[] = [];

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sn], {
      header: 1, defval: "", blankrows: false,
    }) as string[][];

    const hIdx = rows.findIndex(r => norm(r[0]).startsWith("participant"));
    if (hIdx < 0) continue;

    for (let i = hIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const g = (j: number) => String(r[j] ?? "").trim();
      const hasData = Array.from({ length: 111 }, (_, k) => g(1 + k)).some(x => x !== "");
      if (!hasData) continue;

      let name = g(0);
      if (!name || /enter your name/i.test(name)) name = fallbackName;

      out.push({
        name,
        picks: {
          p1: Array.from({ length: 72 }, (_, k) => g(1 + k).toUpperCase()),
          p2: Array.from({ length: 3 }, (_, k) => g(73 + k)),
          p3: {
            winner: g(76), runnerUp: g(77),
            semis: [g(78), g(79)],
            qf: Array.from({ length: 4 }, (_, k) => g(80 + k)),
            r16: Array.from({ length: 8 }, (_, k) => g(84 + k)),
            r32: Array.from({ length: 16 }, (_, k) => g(92 + k)),
          },
          p4: { topScorerTeam: g(108), mostConceded: g(109), goldenBoot: g(110), topEspScorer: g(111) },
        },
      });
    }
    break;
  }
  return out;
}
