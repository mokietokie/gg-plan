"use client";

import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

export function ReportActions({
  reportText,
  fileName,
}: {
  reportText: string;
  fileName: string;
}) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reportText);
      toast.success("클립보드에 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
    }
  }

  function handleDownload() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("파일이 다운로드되었습니다");
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="mr-1.5 h-4 w-4" />
        복사
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="mr-1.5 h-4 w-4" />
        다운로드
      </Button>
    </div>
  );
}
