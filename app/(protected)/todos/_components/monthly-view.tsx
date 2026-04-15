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
import { formatDateISO, getMonthCalendarDays, isToday } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";
import { moveTodo } from "../actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];
const GRID_COLS = "0.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr";
const MAX_VISIBLE_TODOS = 3;
const MAX_VISIBLE_SHARED = 2;

function getInitial(email: string): string {
  return email.charAt(0).toUpperCase();
}

type MoveAction = { type: "move"; id: string; date: string };

function DraggableTodo({
  todo,
  compact = false,
}: {
  todo: Todo;
  compact?: boolean;
}) {
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
        !compact && "truncate",
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

export function MonthlyView({
  year,
  month,
  todos,
  sharedTodos = [],
  emailMap = {},
}: {
  year: number;
  month: number;
  todos: Todo[];
  sharedTodos?: Todo[];
  emailMap?: Record<string, string>;
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

  const days = getMonthCalendarDays(year, month);

  const todosByDate = new Map<string, Todo[]>();
  for (const todo of optimisticTodos) {
    const existing = todosByDate.get(todo.date) ?? [];
    existing.push(todo);
    todosByDate.set(todo.date, existing);
  }

  const sharedByDate = new Map<string, Todo[]>();
  for (const todo of sharedTodos) {
    const existing = sharedByDate.get(todo.date) ?? [];
    existing.push(todo);
    sharedByDate.set(todo.date, existing);
  }

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
            const dayShared = sharedByDate.get(dateStr) ?? [];
            const today = isToday(date);
            const myRemaining = dayTodos.length - MAX_VISIBLE_TODOS;
            const sharedRemaining = dayShared.length - MAX_VISIBLE_SHARED;

            return (
              <DroppableDay
                key={dateStr}
                dateStr={dateStr}
                isOver={overId === dateStr}
                isCurrentMonth={isCurrentMonth}
                onSelect={() => handleDateClick(date)}
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
                            <DraggableTodo
                              key={todo.id}
                              todo={todo}
                              compact
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* 공유 투두 구분선 + 이니셜:제목 */}
                  {dayShared.length > 0 && (
                    <>
                      <div className="border-t border-blue-200 dark:border-blue-800 my-0.5" />
                      {dayShared.slice(0, MAX_VISIBLE_SHARED).map((todo) => {
                        const initial = getInitial(
                          emailMap[todo.user_id] ?? "?"
                        );
                        return (
                          <div
                            key={todo.id}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                              todo.is_completed
                                ? "bg-muted text-muted-foreground line-through"
                                : "bg-blue-100/70 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200"
                            )}
                          >
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {initial}
                            </span>{" "}
                            {todo.title}
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
  isCurrentMonth,
  onSelect,
  children,
}: {
  dateStr: string;
  isOver: boolean;
  isCurrentMonth: boolean;
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
      style={{ minHeight: "110px" }}
      className={cn(
        "min-w-0 cursor-pointer overflow-hidden border-b border-r p-1.5 text-left transition-colors hover:bg-muted/50",
        !isCurrentMonth && "bg-muted/20",
        isOver && "bg-primary/10 ring-2 ring-primary ring-inset"
      )}
    >
      {children}
    </div>
  );
}
