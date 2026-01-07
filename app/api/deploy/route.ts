import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // ローカル環境でのみ実行可能
    if (process.env.VERCEL) {
      return NextResponse.json(
        { success: false, message: 'Vercel環境では実行できません' },
        { status: 403 }
      )
    }

    // Gitの状態を確認
    const { stdout: statusOutput } = await execAsync('git status --porcelain')
    
    if (!statusOutput.trim()) {
      return NextResponse.json(
        { success: false, message: '変更がありません' },
        { status: 400 }
      )
    }

    // Git操作を実行
    const commitMessage = `Update: ${new Date().toLocaleString('ja-JP')}`
    
    await execAsync('git add -A')
    await execAsync(`git commit -m "${commitMessage}"`)
    await execAsync('git push')

    return NextResponse.json({
      success: true,
      message: 'GitHubにプッシュしました。Vercelで自動デプロイが開始されます。'
    })
  } catch (error: any) {
    console.error('Deploy error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'デプロイに失敗しました' 
      },
      { status: 500 }
    )
  }
}
