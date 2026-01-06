-- 候補者テーブルの作成
CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  video_path TEXT NOT NULL,
  icon_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('unreviewed', 'contact', 'stay', 'pass')),
  memo TEXT DEFAULT '',
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  contact_status TEXT CHECK (contact_status IN ('contacted', 'no_response', 'in_progress')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（検索を高速化）
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_gender ON candidates(gender);
CREATE INDEX idx_candidates_created_at ON candidates(created_at);

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_atを自動更新するトリガー
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) を有効化（全員が読み書き可能）
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- 全員が読み書きできるポリシー
CREATE POLICY "Allow all operations" ON candidates
FOR ALL
USING (true)
WITH CHECK (true);
