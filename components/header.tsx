import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
              href="/report"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              주간보고서
            </Link>
            <Link
              href="/stats"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              대쉬보드
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
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
