import { NextRequest, NextResponse } from 'next/server'
import { getCandidates, addCandidate, getCandidateByUrl } from '@/lib/data-supabase'
import { downloadTikTokContent } from '@/lib/download'

// キャッシュ設定（60秒）
export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const candidates = await getCandidates()
    
    const filtered = status 
      ? candidates.filter(c => c.status === status)
      : candidates
    
    // キャッシュヘッダーを設定
    return NextResponse.json(filtered, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, gender, hasReferrer, referrerName, referrerMemo } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      )
    }
    
    // 重複チェック
    const existing = await getCandidateByUrl(url)
    if (existing) {
      // ステータス名を日本語にマッピング
      const statusMap: Record<string, string> = {
        'unreviewed': '📁 未チェック',
        'contact': '📁 連絡する',
        'stay': '📁 保留',
        'pass': '📁 NG'
      }
      
      const statusLabel = statusMap[existing.status] || existing.status
      
      return NextResponse.json(
        { 
          error: `⚠️ このURLは既に登録済みです`,
          duplicateInfo: {
            status: existing.status,
            statusLabel: statusLabel,
            username: existing.username,
            memo: existing.memo
          }
        },
        { status: 400 }
      )
    }

    // ダウンロード処理
    const { videoPath, iconPath, username } = await downloadTikTokContent(url)
    
    // データベースに保存
    const candidate = await addCandidate({
      url,
      username,
      videoPath,
      iconPath,
      status: 'unreviewed',
      memo: '',
      gender: gender || null,
      hasReferrer: hasReferrer || false,
      referrerName: referrerName || '',
      referrerMemo: referrerMemo || '',
    })

    return NextResponse.json(candidate)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'ダウンロードに失敗しました' },
      { status: 500 }
    )
  }
}
