#!/bin/bash

# Vercelにデプロイするスクリプト

cd /Users/dowie009/scout-manager

echo "📦 変更をGitHubにプッシュしてVercelにデプロイします..."
echo ""

# 変更があるかチェック
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️  変更がありません。"
    exit 0
fi

# 変更を表示
echo "変更されたファイル:"
git status --short
echo ""

# コミットメッセージを入力
read -p "コミットメッセージを入力してください（Enterでデフォルト）: " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Git操作
echo ""
echo "📝 変更をコミット中..."
git add -A
git commit -m "$commit_message"

echo ""
echo "🚀 GitHubにプッシュ中..."
git push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ プッシュが完了しました！"
    echo "Vercelで自動デプロイが開始されます。"
    echo ""
    echo "Vercelダッシュボード: https://vercel.com/dashboard"
    echo ""
    read -p "Vercelダッシュボードを開きますか？ (y/n): " open_vercel
    if [ "$open_vercel" = "y" ] || [ "$open_vercel" = "Y" ]; then
        open https://vercel.com/dashboard
    fi
else
    echo ""
    echo "❌ プッシュに失敗しました。"
    echo "GitHubの認証情報を確認してください。"
fi
