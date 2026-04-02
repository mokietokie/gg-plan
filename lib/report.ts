import type { Todo } from "@/types/todo";
import { formatWeekRangeKR, formatDateKR, parseDate } from "@/lib/date";

export type ReportInput = {
  todos: Todo[];
  nextWeekTodos: Todo[];
  userEmail: string;
  weekStart: Date;
  weekEnd: Date;
};

function groupByCategory(todos: Todo[]): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  for (const todo of todos) {
    const cat = todo.category ?? "기타";
    const list = map.get(cat) ?? [];
    list.push(todo);
    map.set(cat, list);
  }
  return map;
}

function sortedCategories(map: Map<string, Todo[]>): [string, Todo[]][] {
  const entries = Array.from(map.entries());
  entries.sort((a, b) => {
    if (a[0] === "기타") return 1;
    if (b[0] === "기타") return -1;
    return a[0].localeCompare(b[0], "ko");
  });
  return entries;
}

function todoDateLabel(todo: Todo, useCompletedAt: boolean): string {
  if (useCompletedAt && todo.completed_at) {
    return formatDateKR(new Date(todo.completed_at));
  }
  return formatDateKR(parseDate(todo.date));
}

export function generateReport(input: ReportInput): string {
  const { todos, nextWeekTodos, userEmail, weekStart, weekEnd } = input;

  const completed = todos.filter((t) => t.is_completed);
  const inProgress = todos.filter((t) => !t.is_completed);

  const lines: string[] = [];

  lines.push("[주간업무보고서]");
  lines.push(`기간: ${formatWeekRangeKR(weekStart, weekEnd)}`);
  lines.push(`작성자: ${userEmail}`);
  lines.push("");

  // 완료 업무
  lines.push("■ 완료 업무");
  if (completed.length === 0) {
    lines.push("  (없음)");
  } else {
    const grouped = sortedCategories(groupByCategory(completed));
    for (const [category, items] of grouped) {
      lines.push(`  [${category}]`);
      for (const todo of items) {
        lines.push(`  - ${todo.title} (${todoDateLabel(todo, true)})`);
      }
    }
  }
  lines.push("");

  // 진행 중
  lines.push("■ 진행 중");
  if (inProgress.length === 0) {
    lines.push("  (없음)");
  } else {
    const grouped = sortedCategories(groupByCategory(inProgress));
    for (const [category, items] of grouped) {
      lines.push(`  [${category}]`);
      for (const todo of items) {
        lines.push(`  - ${todo.title} (${todoDateLabel(todo, false)})`);
      }
    }
  }
  lines.push("");

  // 다음 주 계획
  lines.push("■ 다음 주 계획");
  if (nextWeekTodos.length === 0) {
    lines.push("  (없음)");
  } else {
    for (const todo of nextWeekTodos) {
      lines.push(`  - ${todo.title} (${todoDateLabel(todo, false)})`);
    }
  }

  return lines.join("\n");
}
