"use client";

import { PageHeader } from "@/components/ui";
import PercentageCalculator from "@/components/PercentageCalculator";

// Coach-side calculator: % of a 1-rep max for programming working sets.
export default function NumbersPage() {
  return (
    <div>
      <PageHeader title="Numbers" subtitle="1-rep max percentages for programming" />
      <PercentageCalculator />
    </div>
  );
}
