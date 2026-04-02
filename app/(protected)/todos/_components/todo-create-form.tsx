"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createTodo } from "../actions";
import { CategoryInput } from "./category-input";
import type { ActionResult } from "@/types/todo";
import { toast } from "sonner";

export function TodoCreateForm({
  date,
  categories = [],
  compact,
}: {
  date: string;
  categories?: string[];
  compact?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await createTodo(null, formData);
      if (!result) {
        formRef.current?.reset();
        setCategory("");
        inputRef.current?.focus();
      }
      return result;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
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
        <div className="max-w-[200px]">
          <CategoryInput
            categories={categories}
            value={category}
            onChange={setCategory}
          />
        </div>
      )}
    </form>
  );
}
