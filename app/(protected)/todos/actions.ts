"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/todo";

export async function createTodo(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const title = (formData.get("title") as string)?.trim();
  const date = formData.get("date") as string;
  const category = (formData.get("category") as string)?.trim() || null;

  if (!title) {
    return { error: "할 일을 입력해주세요." };
  }

  if (!date) {
    return { error: "날짜를 선택해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("todos").insert({
    user_id: user.id,
    title,
    date,
    category,
    is_completed: false,
  });

  if (error) {
    return { error: "투두 생성에 실패했습니다." };
  }

  revalidatePath("/todos");
  return null;
}

export async function toggleTodo(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const isCompleted = formData.get("is_completed") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("todos")
    .update({
      is_completed: !isCompleted,
      completed_at: !isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/todos");
}

export async function updateTodo(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;

  if (!title) {
    return { error: "할 일을 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("todos")
    .update({ title, category })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "수정에 실패했습니다." };
  }

  revalidatePath("/todos");
  return null;
}

export async function deleteTodo(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("todos").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/todos");
}

export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("todos")
    .select("category")
    .eq("user_id", user.id)
    .not("category", "is", null)
    .order("created_at", { ascending: false });

  if (!data) return [];

  const unique = [...new Set(data.map((d) => d.category as string))];
  return unique.slice(0, 10);
}
