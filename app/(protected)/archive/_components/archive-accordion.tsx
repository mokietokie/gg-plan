"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Check, Circle } from "lucide-react";
import { formatDateKR, parseDate } from "@/lib/date";
import type { WeekGroup } from "@/types/archive";
import type { Todo } from "@/types/todo";

type ArchiveAccordionProps = {
  groups: WeekGroup[];
  isFiltering: boolean;
};

export function ArchiveAccordion({ groups, isFiltering }: ArchiveAccordionProps) {
  if (groups.length === 0) {
    return (
      <div className="text-muted-foreground py-16 text-center">
        <p className="text-base font-medium">
          {isFiltering ? "검색 결과가 없습니다" : "이 기간에 업무가 없습니다"}
        </p>
        <p className="mt-1 text-sm">
          {isFiltering
            ? "다른 검색어를 시도해보세요"
            : "다른 기간이나 카테고리를 선택해보세요"}
        </p>
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={isFiltering ? groups.map((g) => g.key) : []}
      className="flex flex-col gap-3"
    >
      {groups.map((group) => (
        <AccordionItem
          key={group.key}
          value={group.key}
          className="border-border/60 rounded-xl border px-4 not-last:border-b"
        >
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-center justify-between pr-3">
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{group.label}</span>
                <span className="text-muted-foreground text-xs">
                  {group.rangeLabel}
                </span>
              </div>
              <Badge variant="secondary" className="rounded-full text-xs">
                완료 {group.completed}/{group.total}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="divide-border/40 -mx-1 divide-y">
              {group.todos.map((todo) => (
                <TodoRow key={todo.id} todo={todo} />
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function TodoRow({ todo }: { todo: Todo }) {
  const dateLabel = formatDateKR(parseDate(todo.date));
  return (
    <li className="flex items-start gap-3 px-1 py-2.5">
      <div className="pt-0.5">
        {todo.is_completed ? (
          <div className="bg-primary/10 text-primary flex h-4 w-4 items-center justify-center rounded-full">
            <Check className="h-3 w-3" />
          </div>
        ) : (
          <Circle className="text-muted-foreground h-4 w-4" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-sm ${
              todo.is_completed
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {todo.title}
          </span>
          {todo.category && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full text-[10px] font-normal"
            >
              {todo.category}
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground text-xs">{dateLabel}</span>
      </div>
    </li>
  );
}
