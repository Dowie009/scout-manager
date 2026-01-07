import { supabase, mapSupabaseToCandidate, mapCandidateToSupabase } from './supabase'
import { Candidate } from './data'

export async function getCandidates(): Promise<Candidate[]> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching candidates:', error)
      return []
    }

    return data ? data.map(mapSupabaseToCandidate) : []
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return []
  }
}

export async function getCandidateByUrl(url: string): Promise<Candidate | null> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('url', url)
      .single()

    if (error || !data) {
      return null
    }

    return mapSupabaseToCandidate(data)
  } catch (error) {
    console.error('Error fetching candidate by URL:', error)
    return null
  }
}

export async function addCandidate(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate> {
  const id = Date.now().toString()
  const now = new Date().toISOString()

  const supabaseData = {
    id,
    ...mapCandidateToSupabase(candidate),
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('candidates')
    .insert(supabaseData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add candidate: ${error.message}`)
  }

  return mapSupabaseToCandidate(data)
}

export async function updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
  const supabaseUpdates: any = {}

  if (updates.url !== undefined) supabaseUpdates.url = updates.url
  if (updates.username !== undefined) supabaseUpdates.username = updates.username
  if (updates.videoPath !== undefined) supabaseUpdates.video_path = updates.videoPath
  if (updates.iconPath !== undefined) supabaseUpdates.icon_path = updates.iconPath
  if (updates.status !== undefined) supabaseUpdates.status = updates.status
  if (updates.memo !== undefined) supabaseUpdates.memo = updates.memo
  if (updates.gender !== undefined) supabaseUpdates.gender = updates.gender
  if (updates.contactStatus !== undefined) supabaseUpdates.contact_status = updates.contactStatus
  if (updates.hasReferrer !== undefined) supabaseUpdates.has_referrer = updates.hasReferrer
  if (updates.referrerMemo !== undefined) supabaseUpdates.referrer_memo = updates.referrerMemo

  const { data, error } = await supabase
    .from('candidates')
    .update(supabaseUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return null
  }

  return mapSupabaseToCandidate(data)
}

export async function deleteCandidate(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id)

  return !error
}
