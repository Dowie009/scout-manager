import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs-extra'
import path from 'path'

const execAsync = promisify(exec)

const assetsDir = path.join(process.cwd(), 'public', 'assets')
const videosDir = path.join(assetsDir, 'videos')
const iconsDir = path.join(assetsDir, 'icons')

// yt-dlpのパスを取得（Homebrewでインストールされた場合のパスも含む）
async function getYtDlpPath(): Promise<string> {
  const possiblePaths = [
    'yt-dlp', // PATHにある場合
    '/opt/homebrew/bin/yt-dlp', // Homebrew (Apple Silicon)
    '/usr/local/bin/yt-dlp', // Homebrew (Intel) または直接インストール
  ]

  for (const ytDlpPath of possiblePaths) {
    try {
      await execAsync(`"${ytDlpPath}" --version`)
      return ytDlpPath
    } catch {
      // このパスでは見つからない、次を試す
      continue
    }
  }

  throw new Error('yt-dlpが見つかりません。brew install yt-dlp を実行してください。')
}

export async function downloadTikTokContent(url: string): Promise<{
  videoPath: string
  iconPath: string
  username: string
}> {
  await fs.ensureDir(videosDir)
  await fs.ensureDir(iconsDir)

  const timestamp = Date.now()
  
  // URLがプロフィールページかどうかをチェック（警告のみ、エラーにはしない）
  const isProfilePage = url.includes('/@') && !url.includes('/video/')
  
  // yt-dlpのパスを取得
  const ytDlpPath = await getYtDlpPath()
  
  // 動画をダウンロード（-f bestの警告を避けるため、フォーマット指定を削除）
  const videoFilename = `video_${timestamp}.mp4`
  const videoPath = path.join(videosDir, videoFilename)
  
  try {
    // TikTokの403エラー対策として、より柔軟なオプションを使用
    // プロフィールページの場合は、最新の動画を取得する
    let command = `"${ytDlpPath}" -f "bv*+ba/b" -o "${videoPath}" --no-warnings`
    
    if (isProfilePage) {
      // プロフィールページの場合、最新の1本の動画を取得
      command += ` --playlist-end 1 "${url}"`
    } else {
      // 個別の動画URLの場合
      command += ` --no-playlist "${url}"`
    }
    
    await execAsync(command)
  } catch (error: any) {
    const errorMessage = error.message || error.stderr || String(error)
    
    // エラーメッセージを分析して、より分かりやすいメッセージを返す
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      if (isProfilePage) {
        throw new Error('プロフィールページから動画を取得できませんでした。\n\n解決方法:\n1. 個別の動画URLを使用してください\n2. TikTokアプリで動画を開き、「共有」→「リンクをコピー」で動画URLを取得\n3. 動画URLの形式: https://www.tiktok.com/@username/video/1234567890')
      } else {
        throw new Error('TikTokの動画をダウンロードできませんでした。\n\n考えられる原因:\n1. 動画が非公開または削除されている\n2. TikTokのアクセス制限\n3. 動画URLが正しくない可能性があります')
      }
    } else if (errorMessage.includes('Video unavailable') || errorMessage.includes('No video found')) {
      if (isProfilePage) {
        throw new Error('プロフィールページから動画を取得できませんでした。\n\n個別の動画URLを使用してください:\n1. TikTokアプリで動画を開く\n2. 「共有」ボタンをタップ\n3. 「リンクをコピー」を選択\n4. コピーしたURL（/video/が含まれるURL）を入力')
      } else {
        throw new Error('この動画は利用できません。動画が削除されているか、非公開の可能性があります。')
      }
    } else {
      throw new Error(`動画のダウンロードに失敗しました: ${errorMessage.split('\n')[0]}`)
    }
  }

  // ユーザー名を取得（動画情報から）
  let username = 'unknown'
  try {
    const { stdout } = await execAsync(`"${ytDlpPath}" --dump-json --no-playlist --no-warnings "${url}"`)
    const videoInfo = JSON.parse(stdout)
    username = videoInfo.uploader || videoInfo.channel || videoInfo.uploader_id || videoInfo.creator || 'unknown'
  } catch (error) {
    console.warn('ユーザー名の取得に失敗しました:', error)
    // URLからユーザー名を抽出を試みる
    const match = url.match(/@([^/?]+)/)
    if (match) {
      username = match[1]
    }
  }

  // サムネイル（アイコン）をダウンロード
  const iconFilename = `icon_${timestamp}.jpg`
  const iconPath = path.join(iconsDir, iconFilename)
  
  try {
    await execAsync(`"${ytDlpPath}" --write-thumbnail --skip-download -o "${path.join(iconsDir, `icon_${timestamp}`)}" --no-warnings "${url}"`)
    
    // ダウンロードされたサムネイルファイルを探す（拡張子が不明な場合がある）
    const files = await fs.readdir(iconsDir)
    const thumbnailFile = files.find(f => f.startsWith(`icon_${timestamp}`))
    if (thumbnailFile) {
      const ext = path.extname(thumbnailFile) || '.jpg'
      const newIconPath = path.join(iconsDir, iconFilename)
      await fs.move(path.join(iconsDir, thumbnailFile), newIconPath)
    }
  } catch (error) {
    console.warn('サムネイルのダウンロードに失敗しました:', error)
    // サムネイルが取得できない場合、デフォルト画像を使用
    // ここでは空のパスを返す（フロントエンドで処理）
  }

  return {
    videoPath: `/assets/videos/${videoFilename}`,
    iconPath: `/assets/icons/${iconFilename}`,
    username,
  }
}
