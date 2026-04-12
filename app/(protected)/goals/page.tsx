import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/app/(protected)/todos/actions";
import {
  getObjectives,
  getObjectiveCategories,
  getLinkedTodos,
} from "./actions";
import { buildObjectivesWithProgress } from "@/lib/objectives";
import { YearSelector } from "./_components/year-selector";
import { ObjectiveList } from "./_components/objective-list";
import type { Todo } from "@/types/todo";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? Number(params.year) : new Date().getFullYear();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. 과제 목록 조회
  const objectives = await getObjectives(year);
  const objectiveIds = objectives.map((o) => o.id);

  // 2. 카테고리 매핑 + 연관 투두 + 전체 카테고리 병렬 쿼리
  const [objectiveCategories, allCategories] = await Promise.all([
    getObjectiveCategories(objectiveIds),
    getCategories(),
  ]);

  // 3. 매핑된 모든 카테고리명 수집 → 해당 연도 투두 조회
  const allMappedCategories = [
    ...new Set(objectiveCategories.map((oc) => oc.category_name)),
  ];
  const linkedTodos = await getLinkedTodos(allMappedCategories, year);

  // 4. 진행률 계산
  const objectivesWithProgress = buildObjectivesWithProgress(
    objectives,
    objectiveCategories,
    linkedTodos
  );

  // 5. 과제별 연결 투두 맵 생성
  const linkedTodosMap: Record<string, Todo[]> = {};
  for (const obj of objectivesWithProgress) {
    const categorySet = new Set(obj.categories);
    linkedTodosMap[obj.id] = linkedTodos.filter(
      (t) => t.category !== null && categorySet.has(t.category)
    );
  }

  return (
    <div className="space-y-6">
      <YearSelector year={year} />
      <ObjectiveList
        objectives={objectivesWithProgress}
        linkedTodosMap={linkedTodosMap}
        year={year}
        allCategories={allCategories}
      />
    </div>
  );
}
