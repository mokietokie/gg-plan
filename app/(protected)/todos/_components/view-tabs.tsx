"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ViewTabs({
  currentView,
  date,
}: {
  currentView: "daily" | "weekly" | "monthly";
  date: string;
}) {
  const router = useRouter();

  function handleChange(value: string) {
    router.push(`/todos?date=${date}&view=${value}`);
  }

  return (
    <Tabs value={currentView} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="daily">일간</TabsTrigger>
        <TabsTrigger value="weekly">주간</TabsTrigger>
        <TabsTrigger value="monthly">월간</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
