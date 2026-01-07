import { createClient } from '@supabase/supabase-js'
import { Candidate } from './data'

// 環境変数の取得とデフォルト値の設定
function getSupabaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (envUrl && envUrl.length > 0 && envUrl.startsWith('http')) {
    return envUrl
  }
  // デフォルト値（Vercel環境変数が設定されていない場合）
  return 'https://mvucbeycbzhesbxxelbq.supabase.co'
}

function getSupabaseKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (envKey && envKey.length > 0) {
    return envKey
  }
  // デフォルト値（Vercel環境変数が設定されていない場合）
  return 'sb_publishable_ZbqRa2IWRVtAUm3YXHqZIw_8wWQgJeC'
}

const supabaseUrl = getSupabaseUrl()
const supabaseKey = getSupabaseKey()

// URLの検証
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error(`Invalid supabaseUrl: ${supabaseUrl}. Must be a valid HTTP or HTTPS URL.`)
}

if (!supabaseKey || supabaseKey.length === 0) {
  throw new Error('Supabase key is required')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabaseのデータ形式をCandidate形式に変換
export function mapSupabaseToCandidate(row: any): Candidate {
  return {
    id: row.id,
    url: row.url,
    username: row.username,
    videoPath: row.video_path,
    iconPath: row.icon_path,
    status: row.status,
    memo: row.memo || '',
    gender: row.gender || null,
    contactStatus: row.contact_status || null,
    hasReferrer: row.has_referrer || false,
    referrerName: row.referrer_name || '',
    referrerMemo: row.referrer_memo || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Candidate形式をSupabaseのデータ形式に変換
export function mapCandidateToSupabase(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> | Candidate) {
  return {
    url: candidate.url,
    username: candidate.username,
    video_path: candidate.videoPath,
    icon_path: candidate.iconPath,
    status: candidate.status,
    memo: candidate.memo || '',
    gender: candidate.gender || null,
    contact_status: candidate.contactStatus || null,
    has_referrer: candidate.hasReferrer || false,
    referrer_name: candidate.referrerName || '',
    referrer_memo: candidate.referrerMemo || '',
  }
}
