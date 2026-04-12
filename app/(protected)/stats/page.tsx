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
  computeWeeklyActivity,
} from "@/lib/stats";
import { generateReport, generateMonthlyReport } from "@/lib/report";
import type { Todo } from "@/types/todo";
import type { StatsPeriod } from "@/types/stats";
import { PeriodSelector } from "./_components/period-selector";
import { StatCard } from "./_components/stat-card";
import { CompletionRateCard } from "./_components/completion-rate-card";
import { CategoryChart } from "./_components/category-chart";
import { DailyActivityChart } from "./_components/daily-activity-chart";
import { ReportSection } from "./_components/report-section";

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

function buildWeeklyReports(
  todos: Todo[],
  nextPeriodTodos: Todo[],
  userEmail: string,
  start: Date,
  end: Date
) {
  const reports: { id: string; title: string; text: string; fileName: string }[] = [];
  let current = new Date(start);

  while (current <= end) {
    const { start: weekStart, end: weekEnd } = getWeekRange(current);
    const clampedStart = weekStart < start ? start : weekStart;
    const clampedEnd = weekEnd > end ? end : weekEnd;

    const startStr = formatDateISO(clampedStart);
    const endStr = formatDateISO(clampedEnd);

    const weekTodos = todos.filter((t) => t.date >= startStr && t.date <= endStr);

    // 다음 주 범위
    const { start: nextWeekStart, end: nextWeekEnd } = getWeekRange(addDays(weekEnd, 1));
    const nextStartStr = formatDateISO(nextWeekStart);
    const nextEndStr = formatDateISO(nextWeekEnd);

    // 다음 주 투두: 현재 기간 내 또는 nextPeriodTodos에서 찾기
    const nextWeekTodos = [
      ...todos.filter((t) => t.date >= nextStartStr && t.date <= nextEndStr),
      ...nextPeriodTodos.filter((t) => t.date >= nextStartStr && t.date <= nextEndStr),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

    const sm = clampedStart.getMonth() + 1;
    const sd = clampedStart.getDate();
    const em = clampedEnd.getMonth() + 1;
    const ed = clampedEnd.getDate();

    const text = generateReport({
      todos: weekTodos,
      nextWeekTodos,
      userEmail,
      weekStart: clampedStart,
      weekEnd: clampedEnd,
    });

    reports.push({
      id: `week-${startStr}`,
      title: `주간보고서 (${sm}/${sd} ~ ${em}/${ed})`,
      text,
      fileName: `주간보고서_${startStr}~${endStr}.txt`,
    });

    current = new Date(weekEnd);
    current.setDate(current.getDate() + 1);
  }

  return reports;
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

  // 기간 선택 모드에서 from/to가 없으면 빈 상태 표시
  const isCustomIncomplete = period === "custom" && (!params.from || !params.to);

  if (isCustomIncomplete) {
    return (
      <div className="space-y-6">
        <PeriodSelector
          period={period}
          date={dateStr}
          from={params.from}
          to={params.to}
        />
        <div className="text-muted-foreground text-center py-16">
          <p className="text-lg font-medium">기간을 선택해주세요</p>
          <p className="text-sm mt-1">시작일과 종료일을 모두 입력하면 통계가 표시됩니다</p>
        </div>
      </div>
    );
  }

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

  // 다음 기간 범위 (보고서용)
  let nextPeriodStart: Date;
  let nextPeriodEnd: Date;
  if (period === "monthly") {
    const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const range = getMonthRange(nextMonth.getFullYear(), nextMonth.getMonth());
    nextPeriodStart = range.start;
    nextPeriodEnd = range.end;
  } else if (period === "weekly") {
    const next = getWeekRange(addDays(end, 1));
    nextPeriodStart = next.start;
    nextPeriodEnd = next.end;
  } else {
    // custom: 다음 주 정도만
    nextPeriodStart = addDays(end, 1);
    nextPeriodEnd = addDays(end, 7);
  }

  const nextPeriodStartStr = formatDateISO(nextPeriodStart);
  const nextPeriodEndStr = formatDateISO(nextPeriodEnd);

  // 현재 + 이전 + 다음 기간 투두 병렬 쿼리
  const [currentResult, previousResult, nextPeriodResult] = await Promise.all([
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
    supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", nextPeriodStartStr)
      .lte("date", nextPeriodEndStr)
      .order("date")
      .returns<Todo[]>(),
  ]);

  const todos = currentResult.data ?? [];
  const previousTodos = previousResult.data ?? [];
  const nextPeriodTodos = nextPeriodResult.data ?? [];

  // 서버사이드 집계
  const completionRate = computeCompletionRate(todos, previousTodos);
  const categoryDistribution = computeCategoryDistribution(todos);
  const dailyActivity = computeDailyActivity(todos, start, end);
  const weeklyActivity = period !== "weekly" ? computeWeeklyActivity(todos, start, end) : null;
  const isEmpty = todos.length === 0;

  // 보고서 생성
  const userEmail = user.email ?? "";
  const reports: { id: string; title: string; text: string; fileName: string }[] = [];

  if (!isEmpty) {
    if (period === "monthly") {
      // 월간보고서만
      const monthlyText = generateMonthlyReport({
        todos,
        nextMonthTodos: nextPeriodTodos,
        userEmail,
        monthStart: start,
        monthEnd: end,
      });
      const m = start.getMonth() + 1;
      const y = start.getFullYear();
      reports.push({
        id: "monthly",
        title: `월간보고서 (${y}년 ${m}월)`,
        text: monthlyText,
        fileName: `월간보고서_${y}-${String(m).padStart(2, "0")}.txt`,
      });
    } else if (period === "weekly") {
      // 주간보고서 1개
      const sm = start.getMonth() + 1;
      const sd = start.getDate();
      const em = end.getMonth() + 1;
      const ed = end.getDate();
      const text = generateReport({
        todos,
        nextWeekTodos: nextPeriodTodos,
        userEmail,
        weekStart: start,
        weekEnd: end,
      });
      reports.push({
        id: "weekly",
        title: `주간보고서 (${sm}/${sd} ~ ${em}/${ed})`,
        text,
        fileName: `주간보고서_${startStr}~${endStr}.txt`,
      });
    } else {
      // 커스텀: 주간보고서들
      const weeklyReports = buildWeeklyReports(todos, nextPeriodTodos, userEmail, start, end);
      reports.push(...weeklyReports);
    }
  }

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
            <StatCard title="미완료" value={`${completionRate.total - completionRate.completed}건`} />
          </div>

          {/* 차트 2열 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CategoryChart data={categoryDistribution} />
            {weeklyActivity ? (
              <DailyActivityChart mode="weekly" data={weeklyActivity} />
            ) : (
              <DailyActivityChart data={dailyActivity} />
            )}
          </div>

          {/* 보고서 아코디언 */}
          <ReportSection reports={reports} />
        </>
      )}
    </div>
  );
}
