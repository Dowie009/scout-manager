# 🚀 スカウト管理アプリ - 簡単起動ガイド

## 📱 Mac起動時にアプリを立ち上げる方法

### 方法1: スクリプトをダブルクリック（最も簡単）

1. Finderで `/Users/dowie009/scout-manager/start-app.sh` を開く
2. ファイルをダブルクリック
3. 自動的にブラウザが開きます！

### 方法2: Dockに追加（推奨）

1. Finderで `/Users/dowie009/scout-manager/start-app.sh` を開く
2. ファイルを右クリック → 「情報を見る」
3. 「このアプリケーションで開く」を「ターミナル」に設定
4. ファイルをDockにドラッグ&ドロップ
5. 次回からDockのアイコンをクリックするだけで起動！

### 方法3: エイリアスを作成

ターミナルで以下を実行：

```bash
echo 'alias scout-start="cd /Users/dowie009/scout-manager && npm run dev"' >> ~/.zshrc
source ~/.zshrc
```

その後、ターミナルで `scout-start` と入力するだけで起動します。

## ☁️ Vercelにデプロイする方法

### 方法1: スクリプトをダブルクリック（最も簡単）

1. Finderで `/Users/dowie009/scout-manager/deploy-to-vercel.sh` を開く
2. ファイルをダブルクリック
3. コミットメッセージを入力（Enterでデフォルト）
4. 自動的にGitHubにプッシュされ、Vercelでデプロイが開始されます！

### 方法2: ターミナルから実行

```bash
cd /Users/dowie009/scout-manager
./deploy-to-vercel.sh
```

## 📋 日常的なワークフロー

### 1. アプリを起動
- `start-app.sh` をダブルクリック
- または Dockのアイコンをクリック

### 2. 候補者を登録
- ブラウザで `http://localhost:3001` を開く
- TikTokのURLを入力して登録

### 3. Vercelにデプロイ
- `deploy-to-vercel.sh` をダブルクリック
- コミットメッセージを入力（またはEnterでデフォルト）
- 完了！

## 💡 便利なTips

- **ローカルサーバーは起動したままにしておく**: git pushしてもサーバーは停止しません
- **複数のターミナルウィンドウを使う**: 1つはサーバー起動用、もう1つはgit操作用
- **Vercelの自動デプロイ**: GitHubにプッシュすると自動的にVercelでデプロイが開始されます

## 🔧 トラブルシューティング

### ポート3001が使用中の場合
- 既に起動しているサーバーがある可能性があります
- ブラウザで `http://localhost:3001` を開いて確認してください

### git pushが失敗する場合
- GitHubの認証情報を確認してください
- ターミナルで手動で `git push` を実行してみてください
