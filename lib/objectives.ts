import type { Todo } from "@/types/todo";
import type {
  Objective,
  ObjectiveCategory,
  ObjectiveWithProgress,
} from "@/types/objective";

export function computeObjectiveProgress(linkedTodos: Todo[]): {
  total: number;
  completed: number;
  progress: number;
} {
  const total = linkedTodos.length;
  const completed = linkedTodos.filter((t) => t.is_completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, progress };
}

export function buildObjectivesWithProgress(
  objectives: Objective[],
  objectiveCategories: ObjectiveCategory[],
  todos: Todo[]
): ObjectiveWithProgress[] {
  // objective_id별 카테고리 그룹핑
  const categoryMap = new Map<string, string[]>();
  for (const oc of objectiveCategories) {
    const list = categoryMap.get(oc.objective_id) ?? [];
    list.push(oc.category_name);
    categoryMap.set(oc.objective_id, list);
  }

  return objectives.map((obj) => {
    const categories = categoryMap.get(obj.id) ?? [];
    const categorySet = new Set(categories);

    const linkedTodos = todos.filter(
      (t) => t.category !== null && categorySet.has(t.category)
    );

    const { total, completed, progress } =
      computeObjectiveProgress(linkedTodos);

    return {
      ...obj,
      categories,
      computed_progress: progress,
      effective_progress: obj.progress_override ?? progress,
      linked_todos_total: total,
      linked_todos_completed: completed,
    };
  });
}
