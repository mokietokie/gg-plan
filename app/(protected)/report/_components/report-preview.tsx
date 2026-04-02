"use client";

import { Card, CardContent } from "@/components/ui/card";

export function ReportPreview({
  reportText,
  isEmpty,
}: {
  reportText: string;
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          이번 주에 등록된 투두가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {reportText}
        </pre>
      </CardContent>
    </Card>
  );
}
