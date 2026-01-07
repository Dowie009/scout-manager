-- 紹介者機能を追加するSQL
-- 既存のcandidatesテーブルにカラムを追加

-- 紹介者がいるかどうか（boolean）
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_referrer BOOLEAN DEFAULT FALSE;

-- 紹介者メモ
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS referrer_memo TEXT DEFAULT '';

-- インデックスを追加（紹介者がいる候補者を検索しやすくする）
CREATE INDEX IF NOT EXISTS idx_candidates_has_referrer ON candidates(has_referrer);
