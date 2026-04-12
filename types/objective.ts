export type Objective = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  year: number;
  progress_override: number | null; // null=자동, 0~100=수동
  status: "active" | "completed" | "cancelled";
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ObjectiveCategory = {
  id: string;
  objective_id: string;
  category_name: string;
  created_at: string;
};

export type ObjectiveWithProgress = Objective & {
  categories: string[];
  computed_progress: number; // 투두 기반 자동 계산
  effective_progress: number; // progress_override ?? computed_progress
  linked_todos_total: number;
  linked_todos_completed: number;
};
