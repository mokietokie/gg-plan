"use client";

import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemoContext } from "./memo-provider";

export function MemoButton() {
  const { setOpen } = useMemoContext();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
          onClick={() => setOpen(true)}
          aria-label="빠른 메모 (M)"
        >
          <StickyNote />
        </Button>
      </TooltipTrigger>
      <TooltipContent>빠른 메모 (M)</TooltipContent>
    </Tooltip>
  );
}
