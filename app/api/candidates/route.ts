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

    // URLから先にユーザー名を抽出
    const usernameMatch = url.match(/@([^/?]+)/)
    const extractedUsername = usernameMatch ? usernameMatch[1] : null

    // ステータス名を日本語にマッピング
    const statusMap: Record<string, string> = {
      'unreviewed': '📁 未チェック',
      'contact': '📁 連絡する',
      'stay': '📁 保留',
      'pass': '📁 NG'
    }

    // URL重複チェック
    const existingByUrl = await getCandidateByUrl(url)
    if (existingByUrl) {
      const statusLabel = statusMap[existingByUrl.status] || existingByUrl.status

      return NextResponse.json(
        {
          error: `⚠️ このURLは既に登録済みです`,
          duplicateInfo: {
            status: existingByUrl.status,
            statusLabel: statusLabel,
            username: existingByUrl.username,
            memo: existingByUrl.memo
          }
        },
        { status: 400 }
      )
    }

    // 同じアカウント（ユーザー名）の重複チェック
    if (extractedUsername) {
      const allCandidates = await getCandidates()
      const existingByUsername = allCandidates.find(c => c.username === extractedUsername)

      if (existingByUsername) {
        const statusLabel = statusMap[existingByUsername.status] || existingByUsername.status

        return NextResponse.json(
          {
            error: `⚠️ このアカウント（@${extractedUsername}）は既に登録済みです`,
            duplicateInfo: {
              status: existingByUsername.status,
              statusLabel: statusLabel,
              username: existingByUsername.username,
              memo: existingByUsername.memo
            }
          },
          { status: 400 }
        )
      }
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
