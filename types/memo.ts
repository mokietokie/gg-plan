export type Memo = {
  user_id: string;
  content: string;
  updated_at: string;
};

export type SaveMemoResult =
  | { updatedAt: string }
  | { error: string };
