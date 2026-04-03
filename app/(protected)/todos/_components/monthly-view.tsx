"use client";

import { useRouter } from "next/navigation";
import { formatDateISO, getMonthCalendarDays, isToday } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];
const GRID_COLS = "0.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr";
const MAX_VISIBLE_TODOS = 3;

export function MonthlyView({
  year,
  month,
  todos,
}: {
  year: number;
  month: number;
  todos: Todo[];
}) {
  const router = useRouter();
  const days = getMonthCalendarDays(year, month);

  // 날짜별 투두 그룹핑
  const todosByDate = new Map<string, Todo[]>();
  for (const todo of todos) {
    const existing = todosByDate.get(todo.date) ?? [];
    existing.push(todo);
    todosByDate.set(todo.date, existing);
  }

  function handleDateClick(date: Date) {
    router.push(`/todos?date=${formatDateISO(date)}&view=daily`);
  }

  return (
    <div>
      {/* 요일 헤더 */}
      <div
        style={{ display: "grid", gridTemplateColumns: GRID_COLS }}
        className="border-b"
      >
        {DAY_HEADERS.map((day, i) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
            style={i === 0 || i === 6 ? { color: "#f472b6" } : undefined}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div
        style={{ display: "grid", gridTemplateColumns: GRID_COLS }}
        className="border-l"
      >
        {days.map((date) => {
          const dateStr = formatDateISO(date);
          const isCurrentMonth = date.getMonth() === month;
          const dayTodos = todosByDate.get(dateStr) ?? [];
          const today = isToday(date);
          const remaining = dayTodos.length - MAX_VISIBLE_TODOS;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDateClick(date)}
              className={cn(
                "min-w-0 overflow-hidden border-b border-r p-1.5 text-left transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/20"
              )}
              style={{ minHeight: "110px" }}
            >
              {/* 날짜 숫자 */}
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    today && "bg-primary text-primary-foreground font-bold",
                    !isCurrentMonth && !today && "text-muted-foreground"
                  )}
                  style={
                    !today && (date.getDay() === 0 || date.getDay() === 6)
                      ? { color: "#f472b6" }
                      : undefined
                  }
                >
                  {date.getDate()}
                </span>
              </div>

              {/* 투두 목록 */}
              <div className="space-y-0.5">
                {dayTodos.slice(0, MAX_VISIBLE_TODOS).map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                      todo.is_completed
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-primary/10 text-foreground"
                    )}
                  >
                    {todo.title}
                  </div>
                ))}
                {remaining > 0 && (
                  <div className="px-1 text-[10px] text-muted-foreground font-medium">
                    +{remaining}개 더
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
