"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toggleTodo, updateTodo, deleteTodo } from "../actions";
import { CategoryInput } from "./category-input";
import type { Todo, ActionResult } from "@/types/todo";
import { toast } from "sonner";

export function TodoItem({
  todo,
  categories = [],
  onOptimisticToggle,
  onOptimisticDelete,
}: {
  todo: Todo;
  categories?: string[];
  onOptimisticToggle: (id: string) => void;
  onOptimisticDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editCategory, setEditCategory] = useState(todo.category ?? "");
  const editRef = useRef<HTMLInputElement>(null);

  const [updateState, updateAction] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await updateTodo(null, formData);
      if (!result) {
        setIsEditing(false);
      } else {
        toast.error(result.error);
      }
      return result;
    },
    null
  );

  useEffect(() => {
    if (isEditing) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [isEditing]);

  function handleToggle() {
    onOptimisticToggle(todo.id);
    const fd = new FormData();
    fd.set("id", todo.id);
    fd.set("is_completed", String(todo.is_completed));
    toggleTodo(fd);
  }

  function handleDelete() {
    onOptimisticDelete(todo.id);
    const fd = new FormData();
    fd.set("id", todo.id);
    deleteTodo(fd);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setEditTitle(todo.title);
      setEditCategory(todo.category ?? "");
      setIsEditing(false);
    }
  }

  return (
    <div className="group flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50">
      <Checkbox
        checked={todo.is_completed}
        onCheckedChange={handleToggle}
        className="shrink-0"
      />

      {isEditing ? (
        <form action={updateAction} className="flex-1 flex items-center gap-2">
          <input type="hidden" name="id" value={todo.id} />
          <Input
            ref={editRef}
            name="title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm"
            disabled={updateState !== null && !updateState?.error}
          />
          <div className="w-[140px] shrink-0">
            <CategoryInput
              categories={categories}
              value={editCategory}
              onChange={setEditCategory}
              compact
            />
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-left text-sm cursor-text ${
            todo.is_completed
              ? "line-through text-muted-foreground"
              : ""
          }`}
        >
          {todo.title}
        </button>
      )}

      {todo.category && !isEditing && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {todo.category}
        </Badge>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
