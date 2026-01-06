# Supabaseセットアップ手順

## 1. パッケージのインストール

ターミナルで以下を実行：

```bash
cd /Users/dowie009/scout-manager
npm install @supabase/supabase-js
```

## 2. データベーステーブルの作成

1. Supabaseダッシュボードにアクセス
2. 左サイドバーの「SQL Editor」を開く
3. 「New query」をクリック
4. `supabase-schema.sql` の内容をコピー＆ペースト
5. 「Run」をクリックして実行

## 3. 環境変数の設定

### ローカル環境（.env.local）

`.env.local` ファイルが既に作成されています。内容を確認してください：

```
NEXT_PUBLIC_SUPABASE_URL=https://mvucbeycbzhesbxxelbq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZbqRa2IWRVtAUm3YXHqZIw_8wWQgJeC
```

### Vercel環境

1. Vercelダッシュボードにアクセス
2. `scout-manager`プロジェクトを開く
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数を追加：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mvucbeycbzhesbxxelbq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ZbqRa2IWRVtAUm3YXHqZIw_8wWQgJeC`
5. 「Save」をクリック
6. 再デプロイを実行（「Deployments」タブから「Redeploy」）

## 4. 既存データの移行（オプション）

ローカルのJSONデータをSupabaseに移行する場合：

```bash
node migrate-to-supabase.js
```

## 5. 動作確認

1. 開発サーバーを起動：
```bash
npm run dev
```

2. ブラウザで `http://localhost:3001` にアクセス
3. 新しい候補者を登録して、Supabaseに保存されることを確認

## 完了！

これでSupabaseへの移行が完了しました。データはクラウドに保存され、複数人で同時にアクセスできるようになります。
