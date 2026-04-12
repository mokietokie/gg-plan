export type SharingInvitation = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
};

export type SharingConnection = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
};

export type SharedUser = {
  id: string;
  email: string;
  nickname: string | null;
};

export type InvitationWithEmail = SharingInvitation & {
  from_email: string;
  to_email: string;
};
