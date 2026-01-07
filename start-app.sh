#!/bin/bash

# スカウト管理アプリを起動するスクリプト

cd /Users/dowie009/scout-manager

# 既に起動しているかチェック
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  ポート3001は既に使用中です。"
    echo "ブラウザで http://localhost:3001 を開いてください。"
    open http://localhost:3001
else
    echo "🚀 スカウト管理アプリを起動しています..."
    echo "ブラウザで http://localhost:3001 が自動的に開きます。"
    
    # 新しいターミナルウィンドウで起動
    osascript -e 'tell application "Terminal" to do script "cd /Users/dowie009/scout-manager && npm run dev"'
    
    # 少し待ってからブラウザを開く
    sleep 3
    open http://localhost:3001
fi
