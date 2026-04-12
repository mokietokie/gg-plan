"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/todo";
import type { SharedUser, InvitationWithEmail } from "@/types/sharing";

export async function getConnectedUsers(): Promise<SharedUser[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: connections } = await supabase
    .from("sharing_connections")
    .select("user_a_id, user_b_id, user_a_nickname, user_b_nickname")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  if (!connections || connections.length === 0) return [];

  // 상대방 ID + 내가 붙인 닉네임 추출
  const nicknameMap = new Map<string, string | null>();
  for (const c of connections) {
    if (c.user_a_id === user.id) {
      nicknameMap.set(c.user_b_id, c.user_a_nickname);
    } else {
      nicknameMap.set(c.user_a_id, c.user_b_nickname);
    }
  }

  const otherIds = Array.from(nicknameMap.keys());

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", otherIds);

  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    email: p.email as string,
    nickname: nicknameMap.get(p.id as string) ?? null,
  }));
}

export async function sendInvitation(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "이메일을 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (email === user.email) {
    return { error: "자기 자신에게는 초대를 보낼 수 없습니다." };
  }

  // 대상 사용자 조회
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!targetProfile) {
    return { error: "등록되지 않은 이메일입니다." };
  }

  // 이미 연결되어 있는지 확인
  const [smallId, bigId] =
    user.id < targetProfile.id
      ? [user.id, targetProfile.id]
      : [targetProfile.id, user.id];

  const { data: existingConnection } = await supabase
    .from("sharing_connections")
    .select("id")
    .eq("user_a_id", smallId)
    .eq("user_b_id", bigId)
    .single();

  if (existingConnection) {
    return { error: "이미 연결된 사용자입니다." };
  }

  // 이미 보낸 초대가 있는지 확인
  const { data: existingInvitation } = await supabase
    .from("sharing_invitations")
    .select("id, status")
    .eq("from_user_id", user.id)
    .eq("to_user_id", targetProfile.id)
    .single();

  if (existingInvitation) {
    if (existingInvitation.status === "pending") {
      return { error: "이미 초대를 보냈습니다." };
    }
    // declined 상태면 삭제 후 재전송
    await supabase
      .from("sharing_invitations")
      .delete()
      .eq("id", existingInvitation.id);
  }

  // 상대방이 나에게 보낸 대기 중 초대가 있는지 확인 → 자동 수락
  const { data: reverseInvitation } = await supabase
    .from("sharing_invitations")
    .select("id")
    .eq("from_user_id", targetProfile.id)
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .single();

  if (reverseInvitation) {
    // 상대방의 초대를 수락 처리
    await supabase
      .from("sharing_invitations")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", reverseInvitation.id);

    await supabase.from("sharing_connections").insert({
      user_a_id: smallId,
      user_b_id: bigId,
    });

    revalidatePath("/todos");
    return null;
  }

  const { error } = await supabase.from("sharing_invitations").insert({
    from_user_id: user.id,
    to_user_id: targetProfile.id,
  });

  if (error) {
    return { error: "초대 전송에 실패했습니다." };
  }

  revalidatePath("/todos");
  return null;
}

export async function getPendingInvitations(): Promise<InvitationWithEmail[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: invitations } = await supabase
    .from("sharing_invitations")
    .select("*")
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!invitations || invitations.length === 0) return [];

  const fromIds = invitations.map((inv) => inv.from_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", fromIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.email as string])
  );

  return invitations.map((inv) => ({
    ...inv,
    from_email: profileMap.get(inv.from_user_id) ?? "",
    to_email: user.email ?? "",
  })) as InvitationWithEmail[];
}

export async function getSentInvitations(): Promise<InvitationWithEmail[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: invitations } = await supabase
    .from("sharing_invitations")
    .select("*")
    .eq("from_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!invitations || invitations.length === 0) return [];

  const toIds = invitations.map((inv) => inv.to_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", toIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.email as string])
  );

  return invitations.map((inv) => ({
    ...inv,
    from_email: user.email ?? "",
    to_email: profileMap.get(inv.to_user_id) ?? "",
  })) as InvitationWithEmail[];
}

export async function acceptInvitation(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: invitation } = await supabase
    .from("sharing_invitations")
    .select("*")
    .eq("id", id)
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .single();

  if (!invitation) return;

  // 초대 수락
  await supabase
    .from("sharing_invitations")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id);

  // 연결 생성 (UUID 정렬)
  const [smallId, bigId] =
    user.id < invitation.from_user_id
      ? [user.id, invitation.from_user_id]
      : [invitation.from_user_id, user.id];

  await supabase.from("sharing_connections").insert({
    user_a_id: smallId,
    user_b_id: bigId,
  });

  revalidatePath("/todos");
}

export async function declineInvitation(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("sharing_invitations")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", id)
    .eq("to_user_id", user.id)
    .eq("status", "pending");

  revalidatePath("/todos");
}

export async function removeConnection(formData: FormData): Promise<void> {
  const targetUserId = formData.get("targetUserId") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const [smallId, bigId] =
    user.id < targetUserId
      ? [user.id, targetUserId]
      : [targetUserId, user.id];

  await supabase
    .from("sharing_connections")
    .delete()
    .eq("user_a_id", smallId)
    .eq("user_b_id", bigId);

  revalidatePath("/todos");
}

export async function updateNickname(formData: FormData): Promise<void> {
  const targetUserId = formData.get("targetUserId") as string;
  const nickname = (formData.get("nickname") as string)?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const [smallId, bigId] =
    user.id < targetUserId
      ? [user.id, targetUserId]
      : [targetUserId, user.id];

  // 내가 user_a면 user_a_nickname, user_b면 user_b_nickname 업데이트
  const updateField =
    user.id === smallId ? "user_a_nickname" : "user_b_nickname";

  await supabase
    .from("sharing_connections")
    .update({ [updateField]: nickname })
    .eq("user_a_id", smallId)
    .eq("user_b_id", bigId);

  revalidatePath("/todos");
}

export async function getPendingInvitationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from("sharing_invitations")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", user.id)
    .eq("status", "pending");

  return count ?? 0;
}
