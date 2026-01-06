// 既存のJSONデータをSupabaseに移行するスクリプト
// 実行方法: node migrate-to-supabase.js

const fs = require('fs-extra')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mvucbeycbzhesbxxelbq.supabase.co'
const supabaseKey = 'sb_publishable_ZbqRa2IWRVtAUm3YXHqZIw_8wWQgJeC'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  try {
    // 既存のJSONファイルを読み込む
    const dataFilePath = path.join(__dirname, 'data', 'candidates.json')
    const candidates = await fs.readJson(dataFilePath)

    console.log(`移行する候補者数: ${candidates.length}件`)

    // 既存のデータを削除（オプション）
    const { error: deleteError } = await supabase
      .from('candidates')
      .delete()
      .neq('id', '0') // すべて削除

    if (deleteError) {
      console.warn('既存データの削除でエラー:', deleteError)
    }

    // データをSupabaseに移行
    const supabaseData = candidates.map(candidate => ({
      id: candidate.id,
      url: candidate.url,
      username: candidate.username,
      video_path: candidate.videoPath,
      icon_path: candidate.iconPath,
      status: candidate.status,
      memo: candidate.memo || '',
      gender: candidate.gender || null,
      contact_status: candidate.contactStatus || null,
      created_at: candidate.createdAt,
      updated_at: candidate.updatedAt,
    }))

    // バッチで挿入（100件ずつ）
    const batchSize = 100
    for (let i = 0; i < supabaseData.length; i += batchSize) {
      const batch = supabaseData.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('candidates')
        .insert(batch)
        .select()

      if (error) {
        console.error(`バッチ ${i / batchSize + 1} の移行でエラー:`, error)
      } else {
        console.log(`バッチ ${i / batchSize + 1} を移行しました (${batch.length}件)`)
      }
    }

    console.log('移行が完了しました！')
  } catch (error) {
    console.error('移行エラー:', error)
  }
}

migrate()
