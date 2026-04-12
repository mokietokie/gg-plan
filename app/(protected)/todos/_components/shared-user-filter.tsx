"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SharedUser } from "@/types/sharing";

export function SharedUserFilter({
  connectedUsers,
  selectedIds,
}: {
  connectedUsers: SharedUser[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (connectedUsers.length === 0) return null;

  function toggleUser(userId: string) {
    const current = new Set(selectedIds);
    if (current.has(userId)) {
      current.delete(userId);
    } else {
      current.add(userId);
    }

    const params = new URLSearchParams(searchParams.toString());
    if (current.size > 0) {
      params.set("shared", Array.from(current).join(","));
    } else {
      params.delete("shared");
    }
    router.replace(`/todos?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/20">
      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 shrink-0">
        동료 투두
      </span>
      {connectedUsers.map((user) => (
        <Label
          key={user.id}
          className="flex items-center gap-1.5 cursor-pointer text-sm"
        >
          <Checkbox
            checked={selectedIds.includes(user.id)}
            onCheckedChange={() => toggleUser(user.id)}
          />
          <span className="truncate max-w-[160px]">{user.nickname ?? user.email}</span>
        </Label>
      ))}
    </div>
  );
}
