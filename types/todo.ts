export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  date: string; // ISO date "2026-04-02"
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type UserCategory = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type ActionResult = {
  error: string;
} | null;

export type CreateTodoResult = {
  id: string;
} | {
  error: string;
} | null;
