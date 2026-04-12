"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyActivityData, WeeklyActivityData } from "@/types/stats";

const chartConfig = {
  created: {
    label: "예정",
    color: "var(--color-chart-2)",
  },
  completed: {
    label: "완료",
    color: "var(--color-chart-1)",
  },
};

type DailyActivityChartProps =
  | { mode?: "daily"; data: DailyActivityData[] }
  | { mode: "weekly"; data: WeeklyActivityData[] };

export function DailyActivityChart(props: DailyActivityChartProps) {
  const isWeekly = props.mode === "weekly";

  const chartData = isWeekly
    ? (props.data as WeeklyActivityData[]).map((d) => ({
        label: d.weekLabel,
        created: d.created,
        completed: d.completed,
      }))
    : (() => {
        const DOW = ["일", "월", "화", "수", "목", "금", "토"];
        return (props.data as DailyActivityData[])
          .filter((d) => {
            const day = new Date(d.date).getDay();
            return day !== 0 && day !== 6;
          })
          .map((d) => ({
            label: d.label,
            dow: DOW[new Date(d.date).getDay()],
            created: d.created,
            completed: d.completed,
          }));
      })();

  const title = isWeekly ? "주간 활동량" : "일별 활동량";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            데이터가 없습니다
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData}>
              {isWeekly ? (
                <XAxis
                  dataKey="label"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
              ) : (
                <XAxis
                  dataKey="label"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  height={40}
                  tick={({ x, y, payload, index }) => {
                    const item = chartData[index] as { dow?: string };
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text textAnchor="middle" fill="currentColor" fontSize={12} dy={12}>
                          {payload.value}
                        </text>
                        <text textAnchor="middle" fill="currentColor" fontSize={11} dy={26} className="text-muted-foreground">
                          {item?.dow}
                        </text>
                      </g>
                    );
                  }}
                />
              )}
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="created" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
