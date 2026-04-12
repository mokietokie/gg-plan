-- ============================================================
-- GG-PLAN: 투두 공유 기능 DB 스키마
-- Supabase SQL Editor에서 순서대로 실행
-- ============================================================

-- 1. profiles 테이블 (auth.users 이메일 조회용)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 신규 가입 시 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 기존 사용자 백필
INSERT INTO profiles (id, email)
SELECT id, email FROM auth.users ON CONFLICT DO NOTHING;

-- ============================================================

-- 2. sharing_invitations 테이블
CREATE TABLE sharing_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now() NOT NULL,
  responded_at timestamptz,
  CONSTRAINT no_self_invite CHECK (from_user_id != to_user_id),
  CONSTRAINT unique_pending UNIQUE (from_user_id, to_user_id)
);
CREATE INDEX idx_invitations_to_pending ON sharing_invitations(to_user_id) WHERE status = 'pending';

ALTER TABLE sharing_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own invitations" ON sharing_invitations FOR SELECT
  USING (auth.uid() IN (from_user_id, to_user_id));
CREATE POLICY "Send invitations" ON sharing_invitations FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Respond to invitations" ON sharing_invitations FOR UPDATE
  USING (auth.uid() = to_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = to_user_id AND status IN ('accepted', 'declined'));
CREATE POLICY "Delete own invitations" ON sharing_invitations FOR DELETE
  USING (auth.uid() IN (from_user_id, to_user_id));

-- ============================================================

-- 3. sharing_connections 테이블
CREATE TABLE sharing_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_a_nickname text,  -- user_a가 user_b에게 붙인 별명
  user_b_nickname text,  -- user_b가 user_a에게 붙인 별명
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT ordered_users CHECK (user_a_id < user_b_id),
  CONSTRAINT unique_connection UNIQUE (user_a_id, user_b_id)
);
CREATE INDEX idx_conn_a ON sharing_connections(user_a_id);
CREATE INDEX idx_conn_b ON sharing_connections(user_b_id);

ALTER TABLE sharing_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own connections" ON sharing_connections FOR SELECT
  USING (auth.uid() IN (user_a_id, user_b_id));
CREATE POLICY "Create connections" ON sharing_connections FOR INSERT
  WITH CHECK (auth.uid() IN (user_a_id, user_b_id));
CREATE POLICY "Update own connections" ON sharing_connections FOR UPDATE
  USING (auth.uid() IN (user_a_id, user_b_id));
CREATE POLICY "Delete connections" ON sharing_connections FOR DELETE
  USING (auth.uid() IN (user_a_id, user_b_id));

-- ============================================================

-- 4. todos SELECT 정책 수정
-- 주의: 기존 SELECT 정책 이름을 확인한 뒤 DROP 필요
-- Supabase Dashboard > Authentication > Policies에서 todos 테이블의 SELECT 정책 이름 확인

-- 예시 (기존 정책 이름이 다를 수 있음 — 확인 후 수정):
-- DROP POLICY "Users can view own todos" ON todos;

-- 새 SELECT 정책: 본인 + 연결된 사용자 투두 읽기
CREATE POLICY "Read own and connected users todos" ON todos FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM sharing_connections
      WHERE (user_a_id = auth.uid() AND user_b_id = todos.user_id)
         OR (user_b_id = auth.uid() AND user_a_id = todos.user_id)
    )
  );
-- INSERT/UPDATE/DELETE 정책은 변경 없음 (본인만 수정 가능)
