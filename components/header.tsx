import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { MemoButton } from "@/components/memo/memo-button";
import { SharingManager } from "@/components/sharing/sharing-manager";
import {
  getConnectedUsers,
  getPendingInvitations,
  getSentInvitations,
  getPendingInvitationCount,
} from "@/app/(protected)/todos/sharing-actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [connectedUsers, pendingInvitations, sentInvitations, pendingCount] =
    await Promise.all([
      getConnectedUsers(),
      getPendingInvitations(),
      getSentInvitations(),
      getPendingInvitationCount(),
    ]);

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/todos" className="text-lg font-bold">
            GG-PLAN
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/todos"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              To-Do
            </Link>
<Link
              href="/stats"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              대쉬보드
            </Link>
            <Link
              href="/archive"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              아카이브
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SharingManager
            connectedUsers={connectedUsers}
            pendingInvitations={pendingInvitations}
            sentInvitations={sentInvitations}
            pendingCount={pendingCount}
          />
          <MemoButton />
          <span className="text-muted-foreground text-sm">{user?.email}</span>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              로그아웃
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
