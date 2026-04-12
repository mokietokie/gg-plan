import type { Todo } from "@/types/todo";
import type {
  CompletionRateData,
  CategoryData,
  DailyActivityData,
  WeeklyActivityData,
} from "@/types/stats";
import { eachDayOfRange, getWeekRange, formatDateISO } from "@/lib/date";

export function computeCompletionRate(
  todos: Todo[],
  previousTodos: Todo[] | null
): CompletionRateData {
  const total = todos.length;
  const completed = todos.filter((t) => t.is_completed).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  let previousRate: number | null = null;
  let change: number | null = null;

  if (previousTodos && previousTodos.length > 0) {
    const prevCompleted = previousTodos.filter((t) => t.is_completed).length;
    previousRate = Math.round((prevCompleted / previousTodos.length) * 100);
    change = rate - previousRate;
  }

  return { total, completed, rate, previousRate, change };
}

export function computeCategoryDistribution(todos: Todo[]): CategoryData[] {
  const map = new Map<string, number>();
  for (const todo of todos) {
    const cat = todo.category ?? "미지정";
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }

  const total = todos.length;
  return Array.from(map.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeDailyActivity(
  todos: Todo[],
  start: Date,
  end: Date
): DailyActivityData[] {
  const days = eachDayOfRange(start, end);

  const createdMap = new Map<string, number>();
  const completedMap = new Map<string, number>();

  for (const todo of todos) {
    createdMap.set(todo.date, (createdMap.get(todo.date) ?? 0) + 1);
    if (todo.is_completed && todo.completed_at) {
      const completedDate = todo.completed_at.slice(0, 10);
      completedMap.set(completedDate, (completedMap.get(completedDate) ?? 0) + 1);
    }
  }

  return days.map((day) => {
    const dateStr = formatDateISO(day);
    return {
      date: dateStr,
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      created: createdMap.get(dateStr) ?? 0,
      completed: completedMap.get(dateStr) ?? 0,
    };
  });
}

export function computeWeeklyActivity(
  todos: Todo[],
  start: Date,
  end: Date
): WeeklyActivityData[] {
  const weeks: WeeklyActivityData[] = [];
  let current = new Date(start);

  while (current <= end) {
    const { start: weekStart, end: weekEnd } = getWeekRange(current);
    const clampedStart = weekStart < start ? start : weekStart;
    const clampedEnd = weekEnd > end ? end : weekEnd;

    const startStr = formatDateISO(clampedStart);
    const endStr = formatDateISO(clampedEnd);

    const weekTodos = todos.filter((t) => t.date >= startStr && t.date <= endStr);
    const created = weekTodos.length;
    const completed = weekTodos.filter((t) => t.is_completed).length;

    const sm = clampedStart.getMonth() + 1;
    const sd = clampedStart.getDate();
    const em = clampedEnd.getMonth() + 1;
    const ed = clampedEnd.getDate();

    weeks.push({
      weekLabel: `${sm}/${sd}~${em}/${ed}`,
      created,
      completed,
    });

    current = new Date(weekEnd);
    current.setDate(current.getDate() + 1);
  }

  return weeks;
}


