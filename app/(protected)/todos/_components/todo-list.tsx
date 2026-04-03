"use client";

import { useOptimistic } from "react";
import { TodoItem } from "./todo-item";
import type { Todo, UserCategory } from "@/types/todo";

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string };

export function TodoList({
  todos,
  categories = [],
  userCategories = [],
}: {
  todos: Todo[];
  categories?: string[];
  userCategories?: UserCategory[];
}) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state: Todo[], action: OptimisticAction) => {
      switch (action.type) {
        case "toggle":
          return state.map((t) =>
            t.id === action.id
              ? { ...t, is_completed: !t.is_completed }
              : t
          );
        case "delete":
          return state.filter((t) => t.id !== action.id);
      }
    }
  );

  // 미완료 먼저, 완료는 아래로
  const sorted = [...optimisticTodos].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    return 0;
  });

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        등록된 할 일이 없습니다
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          categories={categories}
          userCategories={userCategories}
          onOptimisticToggle={(id) =>
            addOptimistic({ type: "toggle", id })
          }
          onOptimisticDelete={(id) =>
            addOptimistic({ type: "delete", id })
          }
        />
      ))}
    </div>
  );
}
