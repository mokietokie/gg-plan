"use client";

import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategoryData } from "@/types/stats";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

type CategoryChartProps = {
  data: CategoryData[];
};

export function CategoryChart({ data }: CategoryChartProps) {
  const chartConfig = Object.fromEntries(
    data.map((d, i) => [
      d.category,
      { label: d.category, color: COLORS[i % COLORS.length] },
    ])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">카테고리별 업무 비중</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            데이터가 없습니다
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <ChartContainer config={chartConfig} className="h-[200px] w-[200px] shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-2 min-w-0">
              {data.map((d, i) => (
                <div key={d.category} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate">{d.category}</span>
                  <span className="text-muted-foreground ml-auto shrink-0">
                    {d.count}건
                  </span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {d.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
