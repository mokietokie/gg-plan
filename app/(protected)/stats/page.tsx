import { createClient } from "@/lib/supabase/server";
import {
  formatDateISO,
  parseDate,
  getWeekRange,
  getMonthRange,
  addDays,
} from "@/lib/date";
import {
  computeCompletionRate,
  computeCategoryDistribution,
  computeDailyActivity,
  computeWeeklyTrend,
  computeTopCategories,
} from "@/lib/stats";
import type { Todo } from "@/types/todo";
import type { StatsPeriod } from "@/types/stats";
import { PeriodSelector } from "./_components/period-selector";
import { StatCard } from "./_components/stat-card";
import { CompletionRateCard } from "./_components/completion-rate-card";
import { CategoryChart } from "./_components/category-chart";
import { DailyActivityChart } from "./_components/daily-activity-chart";
import { WeeklyTrendChart } from "./_components/weekly-trend-chart";
import { TopCategories } from "./_components/top-categories";

function getDateRange(
  period: StatsPeriod,
  date: Date,
  from?: string,
  to?: string
): { start: Date; end: Date } {
  if (period === "monthly") {
    return getMonthRange(date.getFullYear(), date.getMonth());
  }
  if (period === "custom" && from && to) {
    return { start: parseDate(from), end: parseDate(to) };
  }
  // weekly (default)
  return getWeekRange(date);
}

function getPreviousRange(
  period: StatsPeriod,
  start: Date,
  end: Date
): { start: Date; end: Date } {
  if (period === "monthly") {
    const prev = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    return getMonthRange(prev.getFullYear(), prev.getMonth());
  }
  if (period === "custom") {
    const diff = end.getTime() - start.getTime();
    const prevEnd = addDays(start, -1);
    const prevStart = new Date(prevEnd.getTime() - diff);
    return { start: prevStart, end: prevEnd };
  }
  // weekly
  const prevStart = addDays(start, -7);
  const prevEnd = addDays(end, -7);
  return { start: prevStart, end: prevEnd };
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    date?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const period = (params.period ?? "weekly") as StatsPeriod;
  const dateStr = params.date ?? formatDateISO(new Date());
  const current = parseDate(dateStr);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 현재 + 이전 기간 범위 계산
  const { start, end } = getDateRange(period, current, params.from, params.to);
  const { start: prevStart, end: prevEnd } = getPreviousRange(period, start, end);

  const startStr = formatDateISO(start);
  const endStr = formatDateISO(end);
  const prevStartStr = formatDateISO(prevStart);
  const prevEndStr = formatDateISO(prevEnd);

  // 현재 + 이전 기간 투두 병렬 쿼리
  const [currentResult, previousResult] = await Promise.all([
    supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date")
      .returns<Todo[]>(),
    supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", prevStartStr)
      .lte("date", prevEndStr)
      .order("date")
      .returns<Todo[]>(),
  ]);

  const todos = currentResult.data ?? [];
  const previousTodos = previousResult.data ?? [];

  // 서버사이드 집계
  const completionRate = computeCompletionRate(todos, previousTodos);
  const categoryDistribution = computeCategoryDistribution(todos);
  const dailyActivity = computeDailyActivity(todos, start, end);
  const weeklyTrend = computeWeeklyTrend(todos, start, end);
  const topCategories = computeTopCategories(todos);

  const mainCategory =
    categoryDistribution.length > 0 ? categoryDistribution[0].category : "-";

  const isEmpty = todos.length === 0;

  return (
    <div className="space-y-6">
      <PeriodSelector
        period={period}
        date={dateStr}
        from={params.from}
        to={params.to}
      />

      {isEmpty ? (
        <div className="text-muted-foreground text-center py-16">
          <p className="text-lg font-medium">이 기간에 투두가 없습니다</p>
          <p className="text-sm mt-1">다른 기간을 선택하거나 투두를 추가해보세요</p>
        </div>
      ) : (
        <>
          {/* 메트릭 카드 4열 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CompletionRateCard
              rate={completionRate.rate}
              change={completionRate.change}
              dailyData={dailyActivity}
            />
            <StatCard title="총 투두" value={`${completionRate.total}건`} />
            <StatCard title="완료" value={`${completionRate.completed}건`} />
            <StatCard title="주요 카테고리" value={mainCategory} />
          </div>

          {/* 차트 2열 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CategoryChart data={categoryDistribution} />
            <DailyActivityChart data={dailyActivity} />
          </div>

          {/* 주간 추이 (월간/기간에서만) */}
          {period !== "weekly" && weeklyTrend.length > 1 && (
            <WeeklyTrendChart data={weeklyTrend} />
          )}

          {/* TOP 카테고리 */}
          <TopCategories data={topCategories} />
        </>
      )}
    </div>
  );
}
