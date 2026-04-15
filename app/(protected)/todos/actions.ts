"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, CreateTodoResult, Todo, UserCategory } from "@/types/todo";

export async function createTodo(
  _prevState: CreateTodoResult,
  formData: FormData
): Promise<CreateTodoResult> {
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

  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_id: user.id,
      title,
      date,
      category,
      is_completed: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "투두 생성에 실패했습니다." };
  }

  revalidatePath("/todos");
  return { id: data.id };
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

export async function moveTodo(id: string, date: string): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "잘못된 날짜 형식입니다." };
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
    .update({ date })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "이동에 실패했습니다." };
  }

  revalidatePath("/todos");
  return null;
}

export async function deleteTodo(formData: FormData): Promise<Todo | null> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("todos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Todo>();

  await supabase.from("todos").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/todos");
  return data;
}

export async function restoreTodo(todo: Omit<Todo, "created_at">): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== todo.user_id) return;

  await supabase.from("todos").insert({
    id: todo.id,
    user_id: todo.user_id,
    title: todo.title,
    description: todo.description,
    category: todo.category,
    date: todo.date,
    is_completed: todo.is_completed,
    completed_at: todo.completed_at,
  });

  revalidatePath("/todos");
}

export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [{ data: todoData }, { data: presets }] = await Promise.all([
    supabase
      .from("todos")
      .select("category")
      .eq("user_id", user.id)
      .not("category", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_categories")
      .select("name")
      .eq("user_id", user.id)
      .order("sort_order"),
  ]);

  const presetNames = (presets ?? []).map((p) => p.name as string);
  const todoCategories = [
    ...new Set((todoData ?? []).map((d) => d.category as string)),
  ];
  const merged = [...new Set([...presetNames, ...todoCategories])];
  return merged.slice(0, 20);
}

export async function getUserCategories(): Promise<UserCategory[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("user_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order")
    .order("created_at")
    .returns<UserCategory[]>();

  return data ?? [];
}

export async function addUserCategory(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { error: "카테고리 이름을 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("user_categories").insert({
    user_id: user.id,
    name,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 등록된 카테고리입니다." };
    }
    return { error: "카테고리 추가에 실패했습니다." };
  }

  revalidatePath("/todos");
  return null;
}

export async function deleteUserCategory(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("user_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/todos");
}
