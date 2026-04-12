import { Header } from "@/components/header";
import { MemoProvider } from "@/components/memo/memo-provider";
import { MemoHotkey } from "@/components/memo/memo-hotkey";
import { MemoPanel } from "@/components/memo/memo-panel";
import { getMemo } from "@/app/(protected)/memos/actions";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const memo = await getMemo();

  return (
    <MemoProvider
      initialContent={memo?.content ?? ""}
      initialUpdatedAt={memo?.updated_at ?? null}
    >
      <TooltipProvider delayDuration={200}>
        <div className="min-h-svh">
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </div>
        <MemoHotkey />
        <MemoPanel />
      </TooltipProvider>
    </MemoProvider>
  );
}
