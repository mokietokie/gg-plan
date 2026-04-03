"use client";

import { Area, AreaChart, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyActivityData } from "@/types/stats";

type CompletionRateCardProps = {
  rate: number;
  change: number | null;
  dailyData: DailyActivityData[];
};

const chartConfig = {
  completed: {
    label: "완료",
    color: "var(--color-chart-1)",
  },
};

export function CompletionRateCard({
  rate,
  change,
  dailyData,
}: CompletionRateCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          완료율
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{rate}%</span>
          {change !== null && (
            <span
              className={`text-xs ${
                change > 0
                  ? "text-green-600"
                  : change < 0
                    ? "text-red-600"
                    : "text-muted-foreground"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          )}
        </div>
        {dailyData.length > 0 && (
          <ChartContainer config={chartConfig} className="mt-3 h-[60px] w-full">
            <AreaChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="var(--color-chart-1)"
                fill="url(#completedGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
