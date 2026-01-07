-- 紹介者機能を更新するSQL
-- 紹介者名フィールドを追加

-- 紹介者名（紹介者の名前）
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS referrer_name TEXT DEFAULT '';
