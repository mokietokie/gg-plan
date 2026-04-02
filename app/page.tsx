import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, CalendarDays, FileText } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/todos");
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          투두만 쓰면
          <br />
          <span className="text-primary">주간보고서</span>가 자동으로
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md text-lg">
          매일 할 일만 기록하세요. 주간업무보고서는 GG-PLAN이 만들어드립니다.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">시작하기</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">로그인</Link>
          </Button>
        </div>

        {/* Features */}
        <div className="mt-16 grid max-w-2xl gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <ClipboardCheck className="text-primary h-8 w-8" />
            <h3 className="font-semibold">투두 기록</h3>
            <p className="text-muted-foreground text-sm">
              날짜별로 할 일을 간편하게 기록
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CalendarDays className="text-primary h-8 w-8" />
            <h3 className="font-semibold">주간 관리</h3>
            <p className="text-muted-foreground text-sm">
              한 주의 업무를 한눈에 파악
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FileText className="text-primary h-8 w-8" />
            <h3 className="font-semibold">보고서 자동 생성</h3>
            <p className="text-muted-foreground text-sm">
              투두 기반 주간보고서를 클릭 한 번에
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground py-6 text-center text-sm">
        GG-PLAN
      </footer>
    </div>
  );
}
