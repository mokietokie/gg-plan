"use client";

import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { todosToCsv } from "@/lib/archive";
import type { Todo } from "@/types/todo";

type ExportButtonProps = {
  todos: Todo[];
  from: string;
  to: string;
};

export function ExportButton({ todos, from, to }: ExportButtonProps) {
  const disabled = todos.length === 0;
  const fileName = `gg-plan_archive_${from}_${to}.csv`;

  async function handleCopy() {
    try {
      const csv = todosToCsv(todos);
      await navigator.clipboard.writeText(csv);
      toast.success("CSV가 클립보드에 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
    }
  }

  function handleDownload() {
    const csv = todosToCsv(todos);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV가 다운로드되었습니다");
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={disabled}
        className="h-8 px-2.5 text-xs"
      >
        <Copy className="mr-1 h-3.5 w-3.5" />
        복사
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={disabled}
        className="h-8 px-2.5 text-xs"
      >
        <Download className="mr-1 h-3.5 w-3.5" />
        CSV 내보내기
      </Button>
    </div>
  );
}
