"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryMapper } from "./category-mapper";
import { createObjective, updateObjective } from "../actions";
import type { ActionResult } from "@/types/todo";
import type { ObjectiveWithProgress } from "@/types/objective";

export function ObjectiveFormDialog({
  year,
  allCategories,
  objective,
  trigger,
}: {
  year: number;
  allCategories: string[];
  objective?: ObjectiveWithProgress;
  trigger: React.ReactNode;
}) {
  const isEdit = !!objective;
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(
    objective?.categories ?? []
  );
  const [status, setStatus] = useState(objective?.status ?? "active");

  const action = isEdit ? updateObjective : createObjective;
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (prev, formData) => {
      formData.set("categories", categories.join(","));
      if (isEdit) {
        formData.set("id", objective.id);
        formData.set("status", status);
      }
      formData.set("year", String(year));
      const result = await action(prev, formData);
      if (!result) {
        setOpen(false);
      }
      return result;
    },
    null
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && objective) {
      setCategories(objective.categories);
      setStatus(objective.status);
    }
    if (next && !objective) {
      setCategories([]);
      setStatus("active");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "추진과제 수정" : "추진과제 추가"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="obj-title">과제명</Label>
            <Input
              id="obj-title"
              name="title"
              placeholder="예: 신규 서비스 런칭"
              defaultValue={objective?.title ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="obj-desc">설명 (선택)</Label>
            <Textarea
              id="obj-desc"
              name="description"
              placeholder="과제에 대한 상세 설명..."
              defaultValue={objective?.description ?? ""}
              rows={3}
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">진행 중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <CategoryMapper
            categories={categories}
            allCategories={allCategories}
            onChange={setCategories}
          />

          {state?.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "저장 중..." : isEdit ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
