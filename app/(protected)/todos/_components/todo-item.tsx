"use client";

import { useState, useRef, useEffect, useActionState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toggleTodo, updateTodo, deleteTodo, restoreTodo } from "../actions";
import { CategoryInput } from "./category-input";
import type { Todo, ActionResult, UserCategory } from "@/types/todo";
import { toast } from "sonner";

export function TodoItem({
  todo,
  categories = [],
  userCategories = [],
  onOptimisticToggle,
  onOptimisticDelete,
}: {
  todo: Todo;
  categories?: string[];
  userCategories?: UserCategory[];
  onOptimisticToggle: (id: string) => void;
  onOptimisticDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editCategory, setEditCategory] = useState(todo.category ?? "");
  const editRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

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
    startTransition(async () => {
      onOptimisticToggle(todo.id);
      const fd = new FormData();
      fd.set("id", todo.id);
      fd.set("is_completed", String(todo.is_completed));
      await toggleTodo(fd);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      onOptimisticDelete(todo.id);
      const fd = new FormData();
      fd.set("id", todo.id);
      const deleted = await deleteTodo(fd);
      if (deleted) {
        toast("업무가 삭제되었습니다.", {
          action: {
            label: "실행취소",
            onClick: () => {
              restoreTodo(deleted);
            },
          },
        });
      }
    });
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
              userCategories={userCategories}
              value={editCategory}
              onChange={setEditCategory}
              compact
            />
          </div>
          <button type="submit" hidden />
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업무를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 업무는 실행취소로 복구할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                handleDelete();
              }}
            >
              삭제
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
