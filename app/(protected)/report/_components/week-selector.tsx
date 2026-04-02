"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDateISO,
  formatWeekRangeKR,
  parseDate,
  addDays,
  getWeekRange,
} from "@/lib/date";

export function WeekSelector({ date }: { date: string }) {
  const router = useRouter();
  const current = parseDate(date);
  const { start, end } = getWeekRange(current);

  function navigate(direction: number) {
    const next = addDays(current, direction * 7);
    router.push(`/report?date=${formatDateISO(next)}`);
  }

  function goThisWeek() {
    router.push(`/report?date=${formatDateISO(new Date())}`);
  }

  const now = new Date();
  const { start: thisWeekStart } = getWeekRange(now);
  const isThisWeek =
    start.getFullYear() === thisWeekStart.getFullYear() &&
    start.getMonth() === thisWeekStart.getMonth() &&
    start.getDate() === thisWeekStart.getDate();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(-1)}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm font-medium min-w-[140px] text-center">
        {formatWeekRangeKR(start, end)}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(1)}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isThisWeek && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goThisWeek}
          className="text-xs"
        >
          이번 주
        </Button>
      )}
    </div>
  );
}
