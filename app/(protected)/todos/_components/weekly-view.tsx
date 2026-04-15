"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  formatDateISO,
  parseDate,
  addDays,
  getDayOfWeekKR,
  isToday,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";
import { moveTodo } from "../actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const GRID_COLS = "0.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr";
const MAX_VISIBLE_TODOS = 10;
const MAX_VISIBLE_SHARED = 3;

function getInitial(email: string): string {
  return email.charAt(0).toUpperCase();
}

type MoveAction = { type: "move"; id: string; date: string };

function DraggableTodo({ todo }: { todo: Todo }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: todo.id,
    data: { fromDate: todo.date },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab touch-none truncate rounded px-1 py-0.5 text-[11px] leading-tight active:cursor-grabbing",
        isDragging && "opacity-40",
        todo.is_completed
          ? "bg-muted text-muted-foreground line-through"
          : "bg-primary/10 text-foreground"
      )}
    >
      {todo.title}
    </div>
  );
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
  const [optimisticTodos, applyOptimistic] = useOptimistic(
    todos,
    (state: Todo[], action: MoveAction) => {
      if (action.type === "move") {
        return state.map((t) =>
          t.id === action.id ? { ...t, date: action.date } : t
        );
      }
      return state;
    }
  );
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [openPopoverDate, setOpenPopoverDate] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const start = parseDate(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const dateStr = formatDateISO(day);
    const dayTodos = optimisticTodos.filter((t) => t.date === dateStr);
    const daySharedTodos = sharedTodos.filter((t) => t.date === dateStr);
    return { date: day, dateStr, todos: dayTodos, sharedTodos: daySharedTodos };
  });

  function handleDateClick(date: Date) {
    router.push(`/todos?date=${formatDateISO(date)}&view=daily`);
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
    setOpenPopoverDate(null);
  }

  function handleDragOver(e: DragOverEvent) {
    setOverId((e.over?.id as string | undefined) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const id = e.active.id as string;
    const targetDate = e.over?.id as string | undefined;
    const fromDate = e.active.data.current?.fromDate as string | undefined;
    setActiveId(null);
    setOverId(null);
    if (!targetDate || fromDate === targetDate) return;
    startTransition(async () => {
      applyOptimistic({ type: "move", id, date: targetDate });
      await moveTodo(id, targetDate);
    });
  }

  const activeTodo = activeId
    ? optimisticTodos.find((t) => t.id === activeId) ?? null
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setOverId(null);
      }}
    >
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
            return (
            <DroppableDay
              key={dateStr}
              dateStr={dateStr}
              isOver={overId === dateStr}
              onSelect={() => handleDateClick(date)}
            >
              <div className="space-y-0.5">
                {/* 내 투두 (draggable) */}
                {dayTodos.slice(0, MAX_VISIBLE_TODOS).map((todo) => (
                  <DraggableTodo key={todo.id} todo={todo} />
                ))}
                {myRemaining > 0 && (
                  <Popover
                    open={openPopoverDate === dateStr}
                    onOpenChange={(open) => {
                      if (activeId) return;
                      setOpenPopoverDate(open ? dateStr : null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-1 text-left text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        +{myRemaining}개 더
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-56"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {date.getMonth() + 1}월 {date.getDate()}일
                      </div>
                      <div className="space-y-1">
                        {dayTodos.map((todo) => (
                          <DraggableTodo key={todo.id} todo={todo} />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
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
                    {dayShared.length > MAX_VISIBLE_SHARED && (
                      <div className="px-1 text-[10px] text-blue-500 font-medium">
                        +{dayShared.length - MAX_VISIBLE_SHARED}개 더
                      </div>
                    )}
                  </>
                )}
              </div>
            </DroppableDay>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTodo && (
          <div
            className={cn(
              "truncate rounded border border-primary px-1 py-0.5 text-[11px] leading-tight shadow-lg",
              activeTodo.is_completed
                ? "bg-muted text-muted-foreground line-through"
                : "bg-primary/20 text-foreground"
            )}
          >
            {activeTodo.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableDay({
  dateStr,
  isOver,
  onSelect,
  children,
}: {
  dateStr: string;
  isOver: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: dateStr });
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "min-w-0 cursor-pointer overflow-hidden border-b border-r p-1.5 text-left transition-colors last:border-r-0 hover:bg-muted/50",
        isOver && "bg-primary/10 ring-2 ring-primary ring-inset"
      )}
    >
      {children}
    </div>
  );
}
