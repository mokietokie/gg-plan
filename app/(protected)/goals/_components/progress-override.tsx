"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProgressOverride } from "../actions";

export function ProgressOverride({
  objectiveId,
  currentOverride,
  computedProgress,
}: {
  objectiveId: string;
  currentOverride: number | null;
  computedProgress: number;
}) {
  const isManual = currentOverride !== null;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentOverride ?? computedProgress));
  const [isPending, startTransition] = useTransition();

  const save = (newValue: number | null) => {
    startTransition(async () => {
      await updateProgressOverride(objectiveId, newValue);
      setEditing(false);
    });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save(Number(value));
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-7 w-16 text-xs"
          disabled={isPending}
        />
        <span className="text-xs">%</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => save(Number(value))}
          disabled={isPending}
        >
          저장
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setEditing(false)}
          disabled={isPending}
        >
          취소
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {isManual ? (
        <>
          <span className="text-muted-foreground">수동 {currentOverride}%</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground underline"
            onClick={() => {
              setValue(String(currentOverride));
              setEditing(true);
            }}
          >
            수정
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground underline"
            onClick={() => save(null)}
          >
            자동으로
          </button>
        </>
      ) : (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground underline"
          onClick={() => {
            setValue(String(computedProgress));
            setEditing(true);
          }}
        >
          직접 입력
        </button>
      )}
    </div>
  );
}
