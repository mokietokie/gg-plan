"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { createTodo, deleteTodo } from "../actions";
import { CategoryInput } from "./category-input";
import { CategoryManager } from "./category-manager";
import type { CreateTodoResult, UserCategory } from "@/types/todo";
import { toast } from "sonner";

export function TodoCreateForm({
  date,
  categories = [],
  userCategories = [],
  compact,
}: {
  date: string;
  categories?: string[];
  userCategories?: UserCategory[];
  compact?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (_prev: CreateTodoResult, formData: FormData) => {
      const result = await createTodo(null, formData);
      if (result && "id" in result) {
        formRef.current?.reset();
        setCategory("");
        inputRef.current?.focus();
        toast("업무가 등록되었습니다.", {
          action: {
            label: "실행취소",
            onClick: () => {
              const fd = new FormData();
              fd.set("id", result.id);
              deleteTodo(fd);
            },
          },
        });
      }
      return result;
    },
    null
  );

  useEffect(() => {
    if (state && "error" in state) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <input type="hidden" name="date" value={date} />
        <Input
          ref={inputRef}
          name="title"
          placeholder="할 일을 입력하세요"
          autoComplete="off"
          disabled={isPending}
          className={compact ? "h-8 text-sm" : ""}
        />
        <Button
          type="submit"
          size={compact ? "sm" : "default"}
          disabled={isPending}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {!compact && (
        <div className="flex items-center gap-2">
          <div className="w-[180px] shrink-0">
            <CategoryInput
              categories={categories}
              userCategories={userCategories}
              value={category}
              onChange={setCategory}
            />
          </div>
          <CategoryManager userCategories={userCategories} />
          {userCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {userCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setCategory(category === cat.name ? "" : cat.name)
                  }
                >
                  <Badge
                    variant={category === cat.name ? "default" : "secondary"}
                    className="text-xs cursor-pointer transition-colors"
                  >
                    {cat.name}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
