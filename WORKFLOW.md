# ワークフロー: ローカルで動画をダウンロードしてVercelにデプロイ

## 概要

Vercel環境では `yt-dlp` が実行できないため、動画ファイルはローカル環境でダウンロードしてからGitにコミットし、Vercelにデプロイします。

## 手順

### 1. ローカル環境で候補者を登録

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3001 を開く
# TikTokのURLを入力して候補者を登録
# → 自動的に動画とサムネイルがダウンロードされる
```

### 2. 動画ファイルをGitに追加

```bash
# ダウンロードされた動画ファイルとアイコンファイルを確認
ls -la public/assets/videos/
ls -la public/assets/icons/

# Gitに追加
git add public/assets/videos/
git add public/assets/icons/

# コミット
git commit -m "Add video and icon files for candidates"

# GitHubにプッシュ
git push
```

### 3. Vercelで自動デプロイ

- GitHubにプッシュすると、Vercelが自動でデプロイを開始
- 動画ファイルも含めてデプロイされる
- デプロイ完了後、Vercel環境でも動画が再生できる

## 注意事項

### ファイルサイズの制限

- Vercelのデプロイサイズ制限: 通常100MB
- 動画ファイルが多い場合は、Git LFS（Large File Storage）の使用を検討
- または、動画ファイルを外部ストレージ（AWS S3、Cloudinary等）に保存

### 新規登録時の注意

- **Vercel環境で新規登録した場合**: 動画ファイルはダウンロードされない
- **対処法**: 
  1. ローカル環境で同じURLを登録して動画をダウンロード
  2. 動画ファイルをGitにコミット
  3. Vercelで再デプロイ

### 推奨ワークフロー

1. **新規候補者の登録はローカル環境で行う**
   - ローカル環境で `npm run dev` を起動
   - 候補者を登録（動画が自動ダウンロードされる）
   - 動画ファイルをGitにコミット
   - GitHubにプッシュ → Vercelで自動デプロイ

2. **Vercel環境では既存の候補者の閲覧・編集のみ**
   - ステータスの変更
   - メモの追加
   - 削除

## トラブルシューティング

### 動画が表示されない場合

1. 動画ファイルがGitにコミットされているか確認
   ```bash
   git ls-files public/assets/videos/
   ```

2. Vercelのデプロイログで動画ファイルが含まれているか確認

3. ブラウザの開発者ツール（F12）で動画ファイルのパスを確認

### デプロイサイズが大きすぎる場合

1. Git LFSを使用
   ```bash
   git lfs install
   git lfs track "*.mp4"
   git lfs track "*.jpg"
   git add .gitattributes
   ```

2. または、動画ファイルを外部ストレージに移行
