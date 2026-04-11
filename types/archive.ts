import type { Todo } from "./todo";

export type WeekGroup = {
  key: string; // "2026-W15" 같은 고유 키
  label: string; // "4월 2주차"
  rangeLabel: string; // "4.5 ~ 4.11"
  start: string; // ISO date
  end: string; // ISO date
  todos: Todo[];
  completed: number;
  total: number;
};
