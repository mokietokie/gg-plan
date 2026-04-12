"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Todo } from "@/types/todo";
import type { Objective, ObjectiveCategory } from "@/types/objective";

// ─── 조회 ───

export async function getObjectives(year: number): Promise<Objective[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("objectives")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .order("sort_order")
    .order("created_at")
    .returns<Objective[]>();

  return data ?? [];
}

export async function getObjectiveCategories(
  objectiveIds: string[]
): Promise<ObjectiveCategory[]> {
  if (objectiveIds.length === 0) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("objective_categories")
    .select("*")
    .in("objective_id", objectiveIds)
    .returns<ObjectiveCategory[]>();

  return data ?? [];
}

export async function getLinkedTodos(
  categoryNames: string[],
  year: number
): Promise<Todo[]> {
  if (categoryNames.length === 0) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .in("category", categoryNames)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })
    .returns<Todo[]>();

  return data ?? [];
}

// ─── 과제 CRUD ───

export async function createObjective(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const title = (formData.get("title") as string)?.trim();
  const description =
    (formData.get("description") as string)?.trim() || null;
  const year = Number(formData.get("year"));
  const categoriesRaw = formData.get("categories") as string;

  if (!title) {
    return { error: "과제명을 입력해주세요." };
  }

  if (!year || year < 2000 || year > 2100) {
    return { error: "올바른 연도를 선택해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 최대 sort_order 조회
  const { data: maxData } = await supabase
    .from("objectives")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("year", year)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxData?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("objectives")
    .insert({
      user_id: user.id,
      title,
      description,
      year,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "과제 생성에 실패했습니다." };
  }

  // 카테고리 매핑 일괄 삽입
  if (categoriesRaw) {
    const categories = categoriesRaw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (categories.length > 0) {
      await supabase.from("objective_categories").insert(
        categories.map((name) => ({
          objective_id: data.id,
          category_name: name,
        }))
      );
    }
  }

  revalidatePath("/goals");
  return null;
}

export async function updateObjective(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const description =
    (formData.get("description") as string)?.trim() || null;
  const status = formData.get("status") as
    | "active"
    | "completed"
    | "cancelled";
  const categoriesRaw = formData.get("categories") as string;

  if (!title) {
    return { error: "과제명을 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("objectives")
    .update({
      title,
      description,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "과제 수정에 실패했습니다." };
  }

  // 카테고리 전체 교체: 삭제 후 재삽입
  if (categoriesRaw !== null) {
    await supabase
      .from("objective_categories")
      .delete()
      .eq("objective_id", id);

    const categories = (categoriesRaw ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (categories.length > 0) {
      await supabase.from("objective_categories").insert(
        categories.map((name) => ({
          objective_id: id,
          category_name: name,
        }))
      );
    }
  }

  revalidatePath("/goals");
  return null;
}

export async function deleteObjective(objectiveId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("objectives")
    .delete()
    .eq("id", objectiveId)
    .eq("user_id", user.id);

  revalidatePath("/goals");
}

// ─── 카테고리 매핑 ───

export async function addObjectiveCategory(
  objectiveId: string,
  categoryName: string
): Promise<ActionResult> {
  const trimmed = categoryName.trim();
  if (!trimmed) {
    return { error: "카테고리명을 입력해주세요." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("objective_categories").insert({
    objective_id: objectiveId,
    category_name: trimmed,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 매핑된 카테고리입니다." };
    }
    return { error: "카테고리 매핑에 실패했습니다." };
  }

  revalidatePath("/goals");
  return null;
}

export async function removeObjectiveCategory(
  objectiveId: string,
  categoryName: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("objective_categories")
    .delete()
    .eq("objective_id", objectiveId)
    .eq("category_name", categoryName);

  revalidatePath("/goals");
}

// ─── 진행률 ───

export async function updateProgressOverride(
  objectiveId: string,
  value: number | null
): Promise<ActionResult> {
  if (value !== null && (value < 0 || value > 100)) {
    return { error: "진행률은 0~100 사이여야 합니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("objectives")
    .update({
      progress_override: value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", objectiveId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "진행률 업데이트에 실패했습니다." };
  }

  revalidatePath("/goals");
  return null;
}
