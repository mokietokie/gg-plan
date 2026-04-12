import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroTypewriter } from "@/app/_components/hero-typewriter";

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
        <HeroTypewriter />
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground py-6 text-center text-sm">
        Designed and builit by Jung Mok
      </footer>
    </div>
  );
}
