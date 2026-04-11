"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type ArchivePeriodProps = {
  from: string;
  to: string;
};

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ArchivePeriod({ from, to }: ArchivePeriodProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`/archive?${params.toString()}`);
  }

  function applyPreset(kind: "thisMonth" | "lastMonth" | "last3Months") {
    const now = new Date();
    if (kind === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      update(formatDateForInput(start), formatDateForInput(end));
    } else if (kind === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      update(formatDateForInput(start), formatDateForInput(end));
    } else {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      update(formatDateForInput(start), formatDateForInput(end));
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => update(e.target.value, to)}
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
        />
        <span className="text-muted-foreground text-sm">~</span>
        <input
          type="date"
          value={to}
          onChange={(e) => update(from, e.target.value)}
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
        />
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => applyPreset("thisMonth")}
          >
            이번 달
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => applyPreset("lastMonth")}
          >
            지난 달
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => applyPreset("last3Months")}
          >
            최근 3개월
          </Button>
        </div>
      </div>
    </div>
  );
}
