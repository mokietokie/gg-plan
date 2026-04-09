export type StatsPeriod = "weekly" | "monthly" | "custom";

export type CompletionRateData = {
  total: number;
  completed: number;
  rate: number; // 0~100
  previousRate: number | null; // 이전 기간 비율 (비교용)
  change: number | null; // rate - previousRate
};

export type CategoryData = {
  category: string;
  count: number;
  percentage: number; // 0~100
};

export type DailyActivityData = {
  date: string; // ISO date
  label: string; // "4/2"
  created: number;
  completed: number;
};

export type WeeklyTrendData = {
  weekLabel: string; // "4/6 ~ 4/12"
  rate: number; // 0~100
  total: number;
  completed: number;
};

