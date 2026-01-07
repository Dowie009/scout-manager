import fs from 'fs-extra'
import path from 'path'

export type Status = 'unreviewed' | 'contact' | 'stay' | 'pass'
export type Gender = 'male' | 'female' | 'other' | null
export type ContactStatus = 'contacted' | 'no_response' | 'in_progress' | null

export interface Candidate {
  id: string
  url: string
  username: string
  videoPath: string
  iconPath: string
  status: Status
  memo: string
  gender?: Gender // 既存データとの互換性のためオプショナル
  contactStatus?: ContactStatus // 連絡するフォルダ内の詳細ステータス
  hasReferrer?: boolean // 紹介者がいるかどうか
  referrerName?: string // 紹介者名
  referrerMemo?: string // 紹介者メモ
  createdAt: string
  updatedAt: string
}

const dataFilePath = path.join(process.cwd(), 'data', 'candidates.json')

export async function getCandidates(): Promise<Candidate[]> {
  try {
    const data = await fs.readJson(dataFilePath)
    return data
  } catch (error) {
    return []
  }
}

export async function saveCandidates(candidates: Candidate[]): Promise<void> {
  await fs.ensureDir(path.dirname(dataFilePath))
  await fs.writeJson(dataFilePath, candidates, { spaces: 2 })
}

export async function getCandidateByUrl(url: string): Promise<Candidate | null> {
  const candidates = await getCandidates()
  return candidates.find(c => c.url === url) || null
}

export async function addCandidate(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate> {
  const candidates = await getCandidates()
  const newCandidate: Candidate = {
    ...candidate,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  candidates.push(newCandidate)
  await saveCandidates(candidates)
  return newCandidate
}

export async function updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
  const candidates = await getCandidates()
  const index = candidates.findIndex(c => c.id === id)
  if (index === -1) return null
  
  candidates[index] = {
    ...candidates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  await saveCandidates(candidates)
  return candidates[index]
}

export async function deleteCandidate(id: string): Promise<boolean> {
  const candidates = await getCandidates()
  const index = candidates.findIndex(c => c.id === id)
  if (index === -1) return false
  
  candidates.splice(index, 1)
  await saveCandidates(candidates)
  return true
}
