"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ObjectiveCard } from "./objective-card";
import { ObjectiveFormDialog } from "./objective-form-dialog";
import type { ObjectiveWithProgress } from "@/types/objective";
import type { Todo } from "@/types/todo";

export function ObjectiveList({
  objectives,
  linkedTodosMap,
  year,
  allCategories,
}: {
  objectives: ObjectiveWithProgress[];
  linkedTodosMap: Record<string, Todo[]>;
  year: number;
  allCategories: string[];
}) {
  return (
    <div className="space-y-4">
      {objectives.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center">
          <p className="text-lg font-medium">
            {year}년 추진과제가 없습니다
          </p>
          <p className="mt-1 text-sm">
            아래 버튼을 눌러 올해의 중점추진과제를 등록해보세요
          </p>
        </div>
      ) : (
        objectives.map((obj) => (
          <ObjectiveCard
            key={obj.id}
            objective={obj}
            linkedTodos={linkedTodosMap[obj.id] ?? []}
            year={year}
            allCategories={allCategories}
          />
        ))
      )}

      <ObjectiveFormDialog
        year={year}
        allCategories={allCategories}
        trigger={
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            추진과제 추가
          </Button>
        }
      />
    </div>
  );
}
