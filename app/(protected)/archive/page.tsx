import { createClient } from "@/lib/supabase/server";
import { formatDateISO, getMonthRange, parseDate } from "@/lib/date";
import { groupTodosByWeek } from "@/lib/archive";
import { getCategories } from "@/app/(protected)/todos/actions";
import type { Todo } from "@/types/todo";
import { ArchiveSearch } from "./_components/archive-search";
import { ArchivePeriod } from "./_components/archive-period";
import { CategoryChips } from "./_components/category-chips";
import { ArchiveAccordion } from "./_components/archive-accordion";
import { ExportButton } from "./_components/export-button";

type SearchParams = {
  from?: string; // "YYYY-MM-DD"
  to?: string; // "YYYY-MM-DD"
  category?: string; // 쉼표 구분 (예: "KD,AI,__uncategorized__")
  q?: string; // 검색어
};

const UNCATEGORIZED = "__uncategorized__";

function parseCategories(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveRange(params: SearchParams): { start: Date; end: Date } {
  if (params.from && params.to) {
    return {
      start: parseDate(params.from),
      end: parseDate(params.to),
    };
  }
  // 기본: 이번 달
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { start, end } = resolveRange(params);
  const startStr = formatDateISO(start);
  const endStr = formatDateISO(end);

  let query = supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr);

  if (params.q && params.q.trim()) {
    query = query.ilike("title", `%${params.q.trim()}%`);
  }

  const selectedCategories = parseCategories(params.category);
  if (selectedCategories.length > 0) {
    const hasUncategorized = selectedCategories.includes(UNCATEGORIZED);
    const named = selectedCategories.filter((c) => c !== UNCATEGORIZED);
    const orClauses: string[] = [];
    if (named.length > 0) {
      const quoted = named.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(",");
      orClauses.push(`category.in.(${quoted})`);
    }
    if (hasUncategorized) {
      orClauses.push("category.is.null");
    }
    query = query.or(orClauses.join(","));
  }

  const [todosResult, categories] = await Promise.all([
    query.order("date", { ascending: false }),
    getCategories(),
  ]);

  const todos = (todosResult.data ?? []) as Todo[];
  const weekGroups = groupTodosByWeek(todos);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Sticky 필터 영역 */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 space-y-4 pt-2 pb-3 backdrop-blur">
        <ArchiveSearch defaultValue={params.q ?? ""} />
        <ArchivePeriod from={startStr} to={endStr} />
        <CategoryChips categories={categories} selected={selectedCategories} />
      </div>

      {/* 결과 카운트 + 내보내기 */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">총 {todos.length}건</span>
        <ExportButton todos={todos} from={startStr} to={endStr} />
      </div>

      {/* 아코디언 or 빈 상태 */}
      <ArchiveAccordion
        groups={weekGroups}
        isSearching={Boolean(params.q && params.q.trim())}
      />
    </div>
  );
}
