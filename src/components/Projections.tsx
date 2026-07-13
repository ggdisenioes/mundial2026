"use client";
import type { Participant, Results } from "@/types";
import ScenarioBuilder from "@/components/ScenarioBuilder";

export default function Projections({ participants, results, embedded = false }: {
  participants: Participant[]; results: Results; embedded?: boolean;
}) {
  return (
    <div className={embedded ? "max-w-4xl mx-auto" : "max-w-4xl mx-auto px-4 sm:px-6 py-6"}>
      <ScenarioBuilder participants={participants} results={results} />
    </div>
  );
}
