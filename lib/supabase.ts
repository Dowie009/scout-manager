import { createClient } from '@supabase/supabase-js'
import { Candidate } from './data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvucbeycbzhesbxxelbq.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ZbqRa2IWRVtAUm3YXHqZIw_8wWQgJeC'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。')
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
  }
}
