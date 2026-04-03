"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StatsPeriod } from "@/types/stats";
import {
  formatDateISO,
  formatWeekRangeKR,
  formatMonthKR,
  parseDate,
  addDays,
  getWeekRange,
  getMonthRange,
} from "@/lib/date";

type PeriodSelectorProps = {
  period: StatsPeriod;
  date: string;
  from?: string;
  to?: string;
};

export function PeriodSelector({ period, date, from, to }: PeriodSelectorProps) {
  const router = useRouter();
  const current = parseDate(date);

  function changePeriod(newPeriod: string) {
    router.push(`/stats?period=${newPeriod}&date=${date}`);
  }

  function navigate(direction: number) {
    if (period === "weekly") {
      const next = addDays(current, direction * 7);
      router.push(`/stats?period=weekly&date=${formatDateISO(next)}`);
    } else if (period === "monthly") {
      const next = new Date(current.getFullYear(), current.getMonth() + direction, 1);
      router.push(`/stats?period=monthly&date=${formatDateISO(next)}`);
    }
  }

  function goToday() {
    router.push(`/stats?period=${period}&date=${formatDateISO(new Date())}`);
  }

  function getPeriodLabel(): string {
    if (period === "weekly") {
      const { start, end } = getWeekRange(current);
      return formatWeekRangeKR(start, end);
    }
    if (period === "monthly") {
      return formatMonthKR(current);
    }
    if (from && to) {
      return `${from} ~ ${to}`;
    }
    return "";
  }

  function isCurrentPeriod(): boolean {
    const now = new Date();
    if (period === "weekly") {
      const { start } = getWeekRange(current);
      const { start: nowStart } = getWeekRange(now);
      return formatDateISO(start) === formatDateISO(nowStart);
    }
    if (period === "monthly") {
      return (
        current.getFullYear() === now.getFullYear() &&
        current.getMonth() === now.getMonth()
      );
    }
    return false;
  }

  return (
    <div className="space-y-4">
      <Tabs value={period} onValueChange={changePeriod}>
        <TabsList>
          <TabsTrigger value="weekly">주간</TabsTrigger>
          <TabsTrigger value="monthly">월간</TabsTrigger>
          <TabsTrigger value="custom">기간 선택</TabsTrigger>
        </TabsList>
      </Tabs>

      {period !== "custom" && (
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
            {getPeriodLabel()}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(1)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isCurrentPeriod() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToday}
              className="text-xs"
            >
              {period === "weekly" ? "이번 주" : "이번 달"}
            </Button>
          )}
        </div>
      )}

      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from ?? ""}
            onChange={(e) =>
              router.push(
                `/stats?period=custom&date=${date}&from=${e.target.value}&to=${to ?? ""}`
              )
            }
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          />
          <span className="text-muted-foreground text-sm">~</span>
          <input
            type="date"
            value={to ?? ""}
            onChange={(e) =>
              router.push(
                `/stats?period=custom&date=${date}&from=${from ?? ""}&to=${e.target.value}`
              )
            }
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}
