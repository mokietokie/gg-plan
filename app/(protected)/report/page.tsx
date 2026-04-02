import { createClient } from "@/lib/supabase/server";
import {
  formatDateISO,
  getWeekRange,
  addDays,
  parseDate,
} from "@/lib/date";
import { generateReport } from "@/lib/report";
import { WeekSelector } from "./_components/week-selector";
import { ReportPreview } from "./_components/report-preview";
import { ReportActions } from "./_components/report-actions";
import type { Todo } from "@/types/todo";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateStr = params.date ?? formatDateISO(new Date());
  const current = parseDate(dateStr);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 이번 주 (일~토) + 다음 주 범위 계산
  const { start: weekStart, end: weekEnd } = getWeekRange(current);
  const { start: nextWeekStart, end: nextWeekEnd } = getWeekRange(
    addDays(weekEnd, 1)
  );

  const weekStartStr = formatDateISO(weekStart);
  const weekEndStr = formatDateISO(weekEnd);
  const nextWeekStartStr = formatDateISO(nextWeekStart);
  const nextWeekEndStr = formatDateISO(nextWeekEnd);

  // 이번 주 + 다음 주 투두 병렬 쿼리
  const [weekResult, nextWeekResult] = await Promise.all([
      supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", weekStartStr)
        .lte("date", weekEndStr)
        .order("date")
        .order("created_at")
        .returns<Todo[]>(),
      supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", nextWeekStartStr)
        .lte("date", nextWeekEndStr)
        .order("date")
        .order("created_at")
        .returns<Todo[]>(),
    ]);

  const weekTodos = weekResult.data ?? [];
  const nextWeekTodos = nextWeekResult.data ?? [];

  const reportText = generateReport({
    todos: weekTodos,
    nextWeekTodos,
    userEmail: user.email ?? "",
    weekStart,
    weekEnd,
  });

  const fileName = `주간보고서_${weekStartStr}~${weekEndStr}.txt`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <WeekSelector date={dateStr} />
        <ReportActions reportText={reportText} fileName={fileName} />
      </div>

      <ReportPreview
        reportText={reportText}
        isEmpty={weekTodos.length === 0}
      />
    </div>
  );
}
