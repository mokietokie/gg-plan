"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Pencil, Trash2, CheckCircle2, Circle, XCircle } from "lucide-react";
import { deleteObjective } from "../actions";
import { ObjectiveFormDialog } from "./objective-form-dialog";
import { ProgressOverride } from "./progress-override";
import type { ObjectiveWithProgress } from "@/types/objective";
import type { Todo } from "@/types/todo";

const STATUS_CONFIG = {
  active: { label: "진행 중", variant: "default" as const, icon: Circle },
  completed: { label: "완료", variant: "secondary" as const, icon: CheckCircle2 },
  cancelled: { label: "취소", variant: "outline" as const, icon: XCircle },
};

export function ObjectiveCard({
  objective,
  linkedTodos,
  year,
  allCategories,
}: {
  objective: ObjectiveWithProgress;
  linkedTodos: Todo[];
  year: number;
  allCategories: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const statusConfig = STATUS_CONFIG[objective.status];
  const StatusIcon = statusConfig.icon;

  const handleDelete = () => {
    if (!confirm("이 추진과제를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteObjective(objective.id);
    });
  };

  const progressColor =
    objective.effective_progress >= 80
      ? "bg-green-500"
      : objective.effective_progress >= 50
        ? "bg-yellow-500"
        : "bg-blue-500";

  return (
    <Card className={isPending ? "opacity-50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold leading-tight">
                {objective.title}
              </h3>
              <Badge variant={statusConfig.variant} className="shrink-0 gap-1 text-xs">
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            {objective.description && (
              <p className="text-muted-foreground text-sm">
                {objective.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <ObjectiveFormDialog
              year={year}
              allCategories={allCategories}
              objective={objective}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 진행률 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {objective.effective_progress}%
            </span>
            <span className="text-muted-foreground text-sm">
              완료 {objective.linked_todos_completed}/{objective.linked_todos_total}건
            </span>
          </div>
          <Progress
            value={objective.effective_progress}
            className="h-2"
            indicatorClassName={progressColor}
          />
          <ProgressOverride
            objectiveId={objective.id}
            currentOverride={objective.progress_override}
            computedProgress={objective.computed_progress}
          />
        </div>

        {/* 카테고리 뱃지 */}
        {objective.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {objective.categories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* 연결된 투두 아코디언 */}
        {linkedTodos.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="todos" className="border-b-0">
              <AccordionTrigger className="py-2 text-sm hover:no-underline">
                연결된 투두 ({linkedTodos.length}건)
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5">
                  {linkedTodos.slice(0, 20).map((todo) => (
                    <li key={todo.id} className="flex items-center gap-2 text-sm">
                      {todo.is_completed ? (
                        <CheckCircle2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Circle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      )}
                      <span
                        className={
                          todo.is_completed
                            ? "text-muted-foreground line-through"
                            : ""
                        }
                      >
                        {todo.title}
                      </span>
                      <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                        {todo.date.slice(5)}
                      </span>
                    </li>
                  ))}
                  {linkedTodos.length > 20 && (
                    <li className="text-muted-foreground text-xs">
                      외 {linkedTodos.length - 20}건...
                    </li>
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {objective.categories.length === 0 && (
          <p className="text-muted-foreground text-xs">
            연결된 카테고리가 없습니다. 수정 버튼을 눌러 카테고리를 연결해보세요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
