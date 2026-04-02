"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDateKR,
  formatDateISO,
  formatMonthKR,
  formatWeekRangeKR,
  parseDate,
  addDays,
  getWeekRange,
  isToday,
} from "@/lib/date";

export function DateNavigator({
  date,
  view,
}: {
  date: string;
  view: "daily" | "weekly" | "monthly";
}) {
  const router = useRouter();
  const current = parseDate(date);

  function navigate(direction: number) {
    let next: Date;
    if (view === "monthly") {
      next = new Date(current.getFullYear(), current.getMonth() + direction, 1);
    } else {
      const step = view === "weekly" ? 7 : 1;
      next = addDays(current, direction * step);
    }
    router.push(`/todos?date=${formatDateISO(next)}&view=${view}`);
  }

  function goToday() {
    router.push(`/todos?date=${formatDateISO(new Date())}&view=${view}`);
  }

  let label: string;
  if (view === "monthly") {
    label = formatMonthKR(current);
  } else if (view === "weekly") {
    const { start, end } = getWeekRange(current);
    label = formatWeekRangeKR(start, end);
  } else {
    label = formatDateKR(current);
  }

  const isTodayVisible = view === "monthly"
    ? !(current.getFullYear() === new Date().getFullYear() && current.getMonth() === new Date().getMonth())
    : !isToday(current);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm font-medium min-w-[120px] text-center">
        {label}
      </span>

      <Button variant="outline" size="icon" onClick={() => navigate(1)} className="h-8 w-8">
        <ChevronRight className="h-4 w-4" />
      </Button>

      {isTodayVisible && (
        <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">
          오늘
        </Button>
      )}
    </div>
  );
}
