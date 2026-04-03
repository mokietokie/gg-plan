"use client";

import { useActionState, useRef, useEffect, useOptimistic } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, Plus, X } from "lucide-react";
import { addUserCategory, deleteUserCategory } from "../actions";
import type { UserCategory, ActionResult } from "@/types/todo";
import { toast } from "sonner";

type OptimisticAction =
  | { type: "add"; name: string }
  | { type: "delete"; id: string };

export function CategoryManager({
  userCategories,
}: {
  userCategories: UserCategory[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [optimistic, addOptimistic] = useOptimistic(
    userCategories,
    (state: UserCategory[], action: OptimisticAction) => {
      switch (action.type) {
        case "add":
          return [
            ...state,
            {
              id: `temp-${Date.now()}`,
              user_id: "",
              name: action.name,
              sort_order: state.length,
              created_at: new Date().toISOString(),
            },
          ];
        case "delete":
          return state.filter((c) => c.id !== action.id);
      }
    }
  );

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const name = (formData.get("name") as string)?.trim();
      if (name) {
        addOptimistic({ type: "add", name });
      }
      const result = await addUserCategory(null, formData);
      if (!result) {
        inputRef.current?.focus();
        if (inputRef.current) inputRef.current.value = "";
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

  function handleDelete(category: UserCategory) {
    addOptimistic({ type: "delete", id: category.id });
    const fd = new FormData();
    fd.set("id", category.id);
    deleteUserCategory(fd);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px]" align="end">
        <PopoverHeader>
          <PopoverTitle>카테고리 관리</PopoverTitle>
          <PopoverDescription>
            자주 쓰는 카테고리를 등록하세요
          </PopoverDescription>
        </PopoverHeader>
        <Separator />
        <form action={formAction} className="flex gap-1.5">
          <Input
            ref={inputRef}
            name="name"
            placeholder="카테고리 이름"
            autoComplete="off"
            disabled={isPending}
            className="h-8 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="shrink-0 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </form>
        {optimistic.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {optimistic.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
