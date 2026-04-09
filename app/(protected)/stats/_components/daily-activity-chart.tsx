"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyActivityData } from "@/types/stats";

const chartConfig = {
  created: {
    label: "생성",
    color: "var(--color-chart-2)",
  },
  completed: {
    label: "완료",
    color: "var(--color-chart-1)",
  },
};

type DailyActivityChartProps = {
  data: DailyActivityData[];
};

export function DailyActivityChart({ data }: DailyActivityChartProps) {
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const weekdayData = data
    .filter((d) => {
      const day = new Date(d.date).getDay();
      return day !== 0 && day !== 6;
    })
    .map((d) => ({
      ...d,
      dow: DOW[new Date(d.date).getDay()],
    }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">일별 활동량</CardTitle>
      </CardHeader>
      <CardContent>
        {weekdayData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            데이터가 없습니다
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={weekdayData}>
              <XAxis
                dataKey="label"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={({ x, y, payload, index }) => {
                  const item = weekdayData[index];
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
                height={40}
              />
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
