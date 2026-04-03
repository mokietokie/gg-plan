import { createClient } from "@/lib/supabase/server";
import {
  formatDateISO,
  getWeekRange,
  getMonthRange,
  getMonthCalendarDays,
  parseDate,
} from "@/lib/date";
import { TodoCreateForm } from "./_components/todo-create-form";
import { TodoList } from "./_components/todo-list";
import { DateNavigator } from "./_components/date-navigator";
import { ViewTabs } from "./_components/view-tabs";
import { WeeklyView } from "./_components/weekly-view";
import { MonthlyView } from "./_components/monthly-view";
import { getCategories, getUserCategories } from "./actions";
import type { Todo } from "@/types/todo";

type ViewType = "daily" | "weekly" | "monthly";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const dateStr = params.date ?? formatDateISO(new Date());
  const view: ViewType = (["daily", "weekly", "monthly"] as const).includes(
    params.view as ViewType
  )
    ? (params.view as ViewType)
    : "daily";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const current = parseDate(dateStr);

  // 데이터 범위 결정
  let startDate: string;
  let endDate: string;

  if (view === "monthly") {
    // 캘린더 그리드 전체 범위 (이전/다음 달 일부 포함)
    const calendarDays = getMonthCalendarDays(
      current.getFullYear(),
      current.getMonth()
    );
    startDate = formatDateISO(calendarDays[0]);
    endDate = formatDateISO(calendarDays[calendarDays.length - 1]);
  } else if (view === "weekly") {
    const { start, end } = getWeekRange(current);
    startDate = formatDateISO(start);
    endDate = formatDateISO(end);
  } else {
    startDate = dateStr;
    endDate = dateStr;
  }

  const { data: todos = [] } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("is_completed", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Todo[]>();

  const [categories, userCategories] = await Promise.all([
    getCategories(),
    getUserCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <DateNavigator date={dateStr} view={view} />
        <ViewTabs currentView={view} date={dateStr} />
      </div>

      {view === "daily" && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <TodoCreateForm date={dateStr} categories={categories} userCategories={userCategories} />
          </div>
          <TodoList todos={todos ?? []} categories={categories} userCategories={userCategories} />
        </div>
      )}

      {view === "weekly" && (
        <WeeklyView
          weekStart={formatDateISO(getWeekRange(current).start)}
          todos={todos ?? []}
          categories={categories}
        />
      )}

      {view === "monthly" && (
        <MonthlyView
          year={current.getFullYear()}
          month={current.getMonth()}
          todos={todos ?? []}
        />
      )}
    </div>
  );
}
