"use client";

import { useRouter } from "next/navigation";
import {
  formatDateISO,
  parseDate,
  addDays,
  getDayOfWeekKR,
  isToday,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];
const GRID_COLS = "0.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr";
const MAX_VISIBLE_TODOS = 5;
const MAX_VISIBLE_SHARED = 3;

function getInitial(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function WeeklyView({
  weekStart,
  todos,
  sharedTodos = [],
  emailMap = {},
}: {
  weekStart: string;
  todos: Todo[];
  sharedTodos?: Todo[];
  emailMap?: Record<string, string>;
  categories?: string[];
}) {
  const router = useRouter();
  const start = parseDate(weekStart);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const dateStr = formatDateISO(day);
    const dayTodos = todos.filter((t) => t.date === dateStr);
    const daySharedTodos = sharedTodos.filter((t) => t.date === dateStr);
    return { date: day, dateStr, todos: dayTodos, sharedTodos: daySharedTodos };
  });

  function handleDateClick(date: Date) {
    router.push(`/todos?date=${formatDateISO(date)}&view=daily`);
  }

  return (
    <div>
      {/* 요일 + 날짜 헤더 */}
      <div
        style={{ display: "grid", gridTemplateColumns: GRID_COLS }}
        className="border-b"
      >
        {days.map(({ date, dateStr }, i) => {
          const today = isToday(date);
          const isWeekend = i === 0 || i === 6;
          return (
            <div key={dateStr} className="py-2 text-center">
              <div
                className={cn(
                  "text-xs",
                  isWeekend ? "" : "text-muted-foreground"
                )}
                style={isWeekend ? { color: "#f472b6" } : undefined}
              >
                {getDayOfWeekKR(date)}
              </div>
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                  today && "bg-primary text-primary-foreground font-bold"
                )}
                style={!today && isWeekend ? { color: "#f472b6" } : undefined}
              >
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* 7컬럼 그리드 본문 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS,
          minHeight: "480px",
        }}
      >
        {days.map(({ date, dateStr, todos: dayTodos, sharedTodos: dayShared }) => {
          const myRemaining = dayTodos.length - MAX_VISIBLE_TODOS;
          const sharedRemaining = dayShared.length - MAX_VISIBLE_SHARED;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDateClick(date)}
              className="min-w-0 overflow-hidden border-r border-b p-1.5 text-left transition-colors hover:bg-muted/50 last:border-r-0"
            >
              <div className="space-y-0.5">
                {/* 내 투두 */}
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
                {myRemaining > 0 && (
                  <div className="px-1 text-[10px] text-muted-foreground font-medium">
                    +{myRemaining}개 더
                  </div>
                )}

                {/* 공유 투두 구분선 + 사용자별 표시 */}
                {dayShared.length > 0 && (
                  <>
                    <div className="border-t border-blue-200 dark:border-blue-800 my-0.5" />
                    {dayShared.slice(0, MAX_VISIBLE_SHARED).map((todo) => {
                      const initial = getInitial(emailMap[todo.user_id] ?? "?");
                      return (
                        <div
                          key={todo.id}
                          className={cn(
                            "flex items-center gap-0.5 truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                            todo.is_completed
                              ? "bg-muted text-muted-foreground line-through"
                              : "bg-blue-100/70 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200"
                          )}
                        >
                          <span className="shrink-0 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            {initial}
                          </span>
                          <span className="truncate">{todo.title}</span>
                        </div>
                      );
                    })}
                    {sharedRemaining > 0 && (
                      <div className="px-1 text-[10px] text-blue-500 font-medium">
                        +{sharedRemaining}개 더
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
