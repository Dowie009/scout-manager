# 🚀 Cockpitアプリへの統合ガイド

## 概要

スカウト管理アプリの起動・デプロイ機能をCockpitアプリに組み込む方法です。

## 実装方法

### 1. CockpitアプリにAPIルートを追加

`/Users/dowie009/Documents/01　真柴道ゐ/Active/cockpit/app/api/scout-manager/route.ts` を作成：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SCOUT_MANAGER_PATH = '/Users/dowie009/scout-manager';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      // アプリを起動
      const { stdout, stderr } = await execAsync(
        `cd ${SCOUT_MANAGER_PATH} && npm run dev > /dev/null 2>&1 &`
      );
      
      // 少し待ってからブラウザを開く
      setTimeout(() => {
        exec(`open http://localhost:3001`);
      }, 3000);

      return NextResponse.json({ 
        success: true, 
        message: 'スカウト管理アプリを起動しました' 
      });
    }

    if (action === 'deploy') {
      // Vercelにデプロイ
      const { stdout, stderr } = await execAsync(
        `cd ${SCOUT_MANAGER_PATH} && git add -A && git commit -m "Update from Cockpit" && git push`
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Vercelにデプロイを開始しました' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: '不明なアクション' 
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
```

### 2. CockpitアプリにUIコンポーネントを追加

`/Users/dowie009/Documents/01　真柴道ゐ/Active/cockpit/app/ScoutManagerCard.tsx` を作成：

```typescript
'use client';

import { useState } from 'react';

export default function ScoutManagerCard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleStart = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/scout-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      
      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/scout-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy' }),
      });
      
      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🎵 スカウト管理アプリ</h2>
      
      <div className="space-y-3">
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {loading ? '起動中...' : '🚀 アプリを起動'}
        </button>
        
        <button
          onClick={handleDeploy}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'デプロイ中...' : '☁️ Vercelにデプロイ'}
        </button>
        
        {message && (
          <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-700">
            {message}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>• 起動: ローカルサーバーを起動してブラウザを開きます</p>
        <p>• デプロイ: GitHubにプッシュしてVercelで自動デプロイ</p>
      </div>
    </div>
  );
}
```

### 3. HomeClientに追加

`HomeClient.tsx` にインポートして配置：

```typescript
import ScoutManagerCard from './ScoutManagerCard';

// ... 既存のコード ...

return (
  <div>
    {/* 既存のコンテンツ */}
    
    <ScoutManagerCard />
  </div>
);
```

## 注意事項

⚠️ **セキュリティ**: 本番環境では、シェルコマンドの実行は慎重に行ってください。開発環境でのみ使用することを推奨します。

## 代替案: より安全な方法

シェルスクリプトを直接実行する代わりに、Node.jsの`child_process`を使って、より制御された方法で実行することもできます。
