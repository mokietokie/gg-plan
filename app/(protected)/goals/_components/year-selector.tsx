"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function YearSelector({ year }: { year: number }) {
  const router = useRouter();

  const navigate = (y: number) => {
    router.push(`/goals?year=${y}`);
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">추진과제</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(year - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[80px] text-center text-lg font-semibold">
          {year}년
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(year + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
