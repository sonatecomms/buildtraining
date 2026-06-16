"use client";

import { PageHeader } from "@/components/ui";
import PercentageCalculator from "@/components/PercentageCalculator";
import TeamScoreboard from "@/components/TeamScoreboard";

// Coach-side Numbers: team scoreboard + a 1-rep-max percentage calculator.
export default function NumbersPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Numbers" subtitle="Team scoreboard & 1-rep max percentages" />
      <TeamScoreboard />
      <PercentageCalculator />
    </div>
  );
}
