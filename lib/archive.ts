import type { Todo } from "@/types/todo";
import type { WeekGroup } from "@/types/archive";
import { formatDateISO, getWeekRange, parseDate } from "./date";

/**
 * 투두를 주차별로 그룹핑. 주차 시작(일요일) 기준 내림차순 정렬.
 * 주차 라벨은 해당 주 시작일이 속한 월 기준으로 "N월 M주차" 형식.
 */
export function groupTodosByWeek(todos: Todo[]): WeekGroup[] {
  const groups = new Map<string, WeekGroup>();

  for (const todo of todos) {
    const todoDate = parseDate(todo.date);
    const { start, end } = getWeekRange(todoDate);
    const startStr = formatDateISO(start);
    const endStr = formatDateISO(end);
    const key = startStr;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: buildWeekLabel(start),
        rangeLabel: `${start.getMonth() + 1}.${start.getDate()} ~ ${end.getMonth() + 1}.${end.getDate()}`,
        start: startStr,
        end: endStr,
        todos: [],
        completed: 0,
        total: 0,
      };
      groups.set(key, group);
    }

    group.todos.push(todo);
    group.total += 1;
    if (todo.is_completed) group.completed += 1;
  }

  // 각 그룹 내부 투두는 날짜 내림차순 + 생성일 내림차순 정렬
  for (const group of groups.values()) {
    group.todos.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.created_at < b.created_at ? 1 : -1;
    });
  }

  // 주차 그룹은 시작일 내림차순
  return Array.from(groups.values()).sort((a, b) =>
    a.start < b.start ? 1 : -1
  );
}

/** 해당 주가 몇 월의 몇 번째 주인지 계산 (시작일 기준) */
function buildWeekLabel(start: Date): string {
  const month = start.getMonth() + 1;
  const weekOfMonth = Math.ceil(start.getDate() / 7);
  return `${month}월 ${weekOfMonth}주차`;
}

const CSV_HEADERS = ["날짜", "제목", "카테고리", "상태", "완료일시"] as const;

/** CSV 필드 이스케이프: 쉼표/따옴표/줄바꿈 포함 시 따옴표로 감싸고 내부 따옴표는 두 개로 */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCompletedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da} ${hh}:${mm}`;
}

/**
 * 투두 배열을 CSV 문자열로 직렬화.
 * Excel 한글 깨짐 방지를 위해 UTF-8 BOM 포함.
 */
export function todosToCsv(todos: Todo[]): string {
  const BOM = "\uFEFF";
  const rows: string[] = [CSV_HEADERS.join(",")];

  for (const todo of todos) {
    const row = [
      todo.date,
      escapeCsvField(todo.title),
      escapeCsvField(todo.category ?? ""),
      todo.is_completed ? "완료" : "미완료",
      formatCompletedAt(todo.completed_at),
    ];
    rows.push(row.join(","));
  }

  return BOM + rows.join("\r\n");
}
