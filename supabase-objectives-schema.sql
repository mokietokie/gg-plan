-- ============================================================
-- GG-PLAN: 중점추진과제 (Key Objectives) DB 스키마
-- ============================================================

-- 1. objectives 테이블
CREATE TABLE objectives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  year integer NOT NULL,
  progress_override integer,  -- NULL=자동, 0~100=수동
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_objectives_user_year ON objectives(user_id, year);

ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "objectives_select" ON objectives FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "objectives_insert" ON objectives FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "objectives_update" ON objectives FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "objectives_delete" ON objectives FOR DELETE
  USING (auth.uid() = user_id);

-- 2. objective_categories 매핑 테이블
CREATE TABLE objective_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_objective_category UNIQUE (objective_id, category_name)
);

CREATE INDEX idx_obj_cat_objective ON objective_categories(objective_id);
CREATE INDEX idx_obj_cat_name ON objective_categories(category_name);

ALTER TABLE objective_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obj_cat_select" ON objective_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM objectives WHERE id = objective_categories.objective_id AND user_id = auth.uid()));
CREATE POLICY "obj_cat_insert" ON objective_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM objectives WHERE id = objective_categories.objective_id AND user_id = auth.uid()));
CREATE POLICY "obj_cat_delete" ON objective_categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM objectives WHERE id = objective_categories.objective_id AND user_id = auth.uid()));
