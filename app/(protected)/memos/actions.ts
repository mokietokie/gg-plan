"use server";

import { createClient } from "@/lib/supabase/server";
import type { Memo, SaveMemoResult } from "@/types/memo";

export async function getMemo(): Promise<Memo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("memos")
    .select("user_id, content, updated_at")
    .eq("user_id", user.id)
    .maybeSingle<Memo>();

  return data;
}

export async function saveMemo(content: string): Promise<SaveMemoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("memos")
    .upsert(
      {
        user_id: user.id,
        content,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return { error: "메모 저장에 실패했습니다." };
  }

  return { updatedAt: now };
}
