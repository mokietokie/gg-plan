"use client";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

type ReportItem = {
  id: string;
  title: string;
  text: string;
  fileName: string;
};

type ReportSectionProps = {
  reports: ReportItem[];
};

function handleCopy(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("클립보드에 복사되었습니다"),
    () => toast.error("복사에 실패했습니다")
  );
}

function handleDownload(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("파일이 다운로드되었습니다");
}

export function ReportSection({ reports }: ReportSectionProps) {
  if (reports.length === 0) return null;

  return (
    <Accordion type="multiple" defaultValue={[reports[0].id]}>
      {reports.map((report) => (
        <AccordionItem key={report.id} value={report.id}>
          <AccordionTrigger className="text-sm font-medium">
            {report.title}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <pre className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
                {report.text}
              </pre>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(report.text)}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  복사
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(report.text, report.fileName)}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  다운로드
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
