"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Todo } from "@/types/todo";

export function SharedTodoItem({ todo }: { todo: Todo }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/20">
      <Checkbox
        checked={todo.is_completed}
        disabled
        className="shrink-0 opacity-60"
      />

      <span
        className={`flex-1 text-left text-sm ${
          todo.is_completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {todo.title}
      </span>

      {todo.category && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {todo.category}
        </Badge>
      )}
    </div>
  );
}
