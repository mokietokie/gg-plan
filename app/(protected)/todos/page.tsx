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
import { SharedUserFilter } from "./_components/shared-user-filter";
import { SharedTodoItem } from "./_components/shared-todo-item";
import { getCategories, getUserCategories } from "./actions";
import { getConnectedUsers } from "./sharing-actions";
import type { Todo } from "@/types/todo";

type ViewType = "daily" | "weekly" | "monthly";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; shared?: string }>;
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

  // 연결된 사용자 + 내 투두 + 카테고리 병렬 패칭
  const [myTodosResult, categories, userCategories, connectedUsers] =
    await Promise.all([
      supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("is_completed", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<Todo[]>(),
      getCategories(),
      getUserCategories(),
      getConnectedUsers(),
    ]);

  const todos = myTodosResult.data ?? [];

  // 공유 투두 패칭
  const selectedSharedIds = params.shared
    ? params.shared
        .split(",")
        .filter((id) => connectedUsers.some((u) => u.id === id))
    : [];

  let sharedTodos: Todo[] = [];
  if (selectedSharedIds.length > 0) {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .in("user_id", selectedSharedIds)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Todo[]>();
    sharedTodos = data ?? [];
  }

  // 공유 투두를 사용자별로 그룹핑
  const sharedTodosByUser = new Map<string, Todo[]>();
  for (const todo of sharedTodos) {
    const existing = sharedTodosByUser.get(todo.user_id) ?? [];
    existing.push(todo);
    sharedTodosByUser.set(todo.user_id, existing);
  }

  const displayNameMap = new Map(
    connectedUsers.map((u) => [u.id, u.nickname ?? u.email])
  );
  const displayNameRecord: Record<string, string> =
    Object.fromEntries(displayNameMap);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <DateNavigator date={dateStr} view={view} />
        <ViewTabs currentView={view} date={dateStr} />
      </div>

      {connectedUsers.length > 0 && (
        <SharedUserFilter
          connectedUsers={connectedUsers}
          selectedIds={selectedSharedIds}
        />
      )}

      {view === "daily" && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <TodoCreateForm date={dateStr} categories={categories} userCategories={userCategories} />
          </div>
          <TodoList todos={todos} categories={categories} userCategories={userCategories} />

          {Array.from(sharedTodosByUser.entries()).map(
            ([userId, userTodos]) => (
              <div key={userId} className="space-y-2">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 border-l-2 border-blue-400 pl-2">
                  {displayNameMap.get(userId) ?? userId}
                </h3>
                <div className="space-y-2">
                  {userTodos.map((todo) => (
                    <SharedTodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {view === "weekly" && (
        <WeeklyView
          weekStart={formatDateISO(getWeekRange(current).start)}
          todos={todos}
          sharedTodos={sharedTodos}
          emailMap={displayNameRecord}
          categories={categories}
        />
      )}

      {view === "monthly" && (
        <MonthlyView
          year={current.getFullYear()}
          month={current.getMonth()}
          todos={todos}
          sharedTodos={sharedTodos}
          emailMap={displayNameRecord}
        />
      )}
    </div>
  );
}
