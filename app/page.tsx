'use client'

import { useState, useEffect } from 'react'
import { Candidate } from '@/lib/data'
import CandidateCard from '@/components/CandidateCard'
import StatusTabs from '@/components/StatusTabs'
import FinishReviewModal from '@/components/FinishReviewModal'

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentStatus, setCurrentStatus] = useState<'unreviewed' | 'contact' | 'stay' | 'pass'>('unreviewed')
  const [url, setUrl] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>('female') // デフォルトは女性
  const [hasReferrer, setHasReferrer] = useState(false) // 紹介者がいるかどうか
  const [referrerName, setReferrerName] = useState('') // 紹介者名
  const [referrerMemo, setReferrerMemo] = useState('') // 紹介者メモ
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [processedCounts, setProcessedCounts] = useState({ contact: 0, stay: 0, pass: 0 })
  const [isMuted, setIsMuted] = useState(true) // デフォルトはミュート
  const [loadingDots, setLoadingDots] = useState('')
  const [deleteMode, setDeleteMode] = useState(false) // 削除モード
  const [selectedIds, setSelectedIds] = useState<string[]>([]) // 選択されたID
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('oldest') // ソート順
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]) // 全候補者（ナンバー計算用）
  const [abortController, setAbortController] = useState<AbortController | null>(null) // ローディングキャンセル用
  const [isHoveringLoading, setIsHoveringLoading] = useState(false) // ローディングボタンにホバー中か
  const [isLocalEnvironment, setIsLocalEnvironment] = useState(false) // ローカル環境かどうか

  // 環境判定（ローカル環境かどうか）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      setIsLocalEnvironment(hostname === 'localhost' || hostname === '127.0.0.1')
    }
  }, [])

  useEffect(() => {
    loadCandidates()
    loadAllCandidates() // 全候補者を読み込んでナンバー計算用に使用
  }, [currentStatus, sortOrder])

  // 全候補者を読み込んで、全体での登録順を計算
  const loadAllCandidates = async () => {
    try {
      const response = await fetch('/api/candidates')
      const data = await response.json()
      // 登録順（古い順）でソート
      const sorted = data.sort((a: Candidate, b: Candidate) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
      setAllCandidates(sorted)
    } catch (err) {
      console.error('全候補者の読み込みに失敗しました:', err)
    }
  }

  // 候補者の性別別ナンバーを取得（男性は#1から、女性も#1から）
  const getGenderNumber = (candidateId: string, candidateGender?: 'male' | 'female' | 'other' | null): number => {
    if (!candidateGender || candidateGender === 'other') {
      // 性別が未設定またはその他の場合、全体の順番を使用
      const index = allCandidates.findIndex(c => c.id === candidateId)
      return index >= 0 ? index + 1 : 0
    }
    
    // 性別が設定されている場合、その性別内での順番を計算
    const sameGenderCandidates = allCandidates
      .filter(c => c.gender === candidateGender)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    const index = sameGenderCandidates.findIndex(c => c.id === candidateId)
    return index >= 0 ? index + 1 : 0
  }

  // 統計情報を計算
  const getStatistics = () => {
    const stats = {
      total: allCandidates.length,
      male: allCandidates.filter(c => c.gender === 'male').length,
      female: allCandidates.filter(c => c.gender === 'female').length,
      other: allCandidates.filter(c => c.gender === 'other' || !c.gender).length,
      byStatus: {
        unreviewed: allCandidates.filter(c => c.status === 'unreviewed').length,
        contact: allCandidates.filter(c => c.status === 'contact').length,
        stay: allCandidates.filter(c => c.status === 'stay').length,
        pass: allCandidates.filter(c => c.status === 'pass').length,
      }
    }
    return stats
  }

  const statistics = getStatistics()

  // ローディング中のドットアニメーション
  useEffect(() => {
    if (!isLoading) {
      setLoadingDots('')
      return
    }

    const interval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev === '') return '.'
        if (prev === '.') return '..'
        if (prev === '..') return '...'
        return ''
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  const loadCandidates = async () => {
    try {
      const response = await fetch(`/api/candidates?status=${currentStatus}`)
      const data = await response.json()
      // ソート順に応じてソート
      const sortedData = data.sort((a: Candidate, b: Candidate) => {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()
        return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA
      })
      setCandidates(sortedData)
    } catch (err) {
      console.error('候補者の読み込みに失敗しました:', err)
    }
  }

  const handleCancelLoading = () => {
    if (abortController) {
      abortController.abort()
      setIsLoading(false)
      setAbortController(null)
      setError('登録をキャンセルしました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 性別が選択されていない場合はエラー
    if (gender === null) {
      setError('性別を選択してください')
      return
    }
    
    setIsLoading(true)
    setError('')

    // AbortControllerを作成
    const controller = new AbortController()
    setAbortController(controller)

    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, gender, hasReferrer, referrerName, referrerMemo }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        
        // 重複エラーの場合、詳細情報を表示
        if (data.duplicateInfo) {
          const { statusLabel, username, memo } = data.duplicateInfo
          let errorMessage = `${data.error}\n\n現在のステータス: ${statusLabel}\nユーザー名: ${username}`
          if (memo) {
            errorMessage += `\nメモ: ${memo}`
          }
          setError(errorMessage)
        } else {
          setError(data.error || '登録に失敗しました')
        }
        return
      }

            setUrl('')
            setGender('female') // 性別選択をデフォルト（女性）にリセット
            setHasReferrer(false) // 紹介者チェックをリセット
            setReferrerName('') // 紹介者名をリセット
            setReferrerMemo('') // 紹介者メモをリセット
      await loadCandidates()
      await loadAllCandidates() // 新規登録後も全候補者リストを更新
      setAbortController(null)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('登録をキャンセルしました')
      } else {
        setError('登録に失敗しました')
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const handleJudge = async (id: string, status: 'contact' | 'stay' | 'pass', memo: string) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, memo }),
      })

      if (response.ok) {
        // セッション内の処理数をカウント
        setProcessedCounts(prev => ({
          ...prev,
          [status]: prev[status] + 1,
        }))
        
        // カードを非表示にする（アニメーション）
        setCandidates(prev => prev.filter(c => c.id !== id))
        await loadAllCandidates() // 全候補者リストも更新
      }
    } catch (err) {
      console.error('ジャッジの保存に失敗しました:', err)
    }
  }

  const handleUpdateContactStatus = async (id: string, contactStatus: 'contacted' | 'no_response' | 'in_progress') => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactStatus }),
      })

      if (response.ok) {
        // カードの状態を更新
        setCandidates(prev => 
          prev.map(c => c.id === id ? { ...c, contactStatus } : c)
        )
        await loadAllCandidates() // 全候補者リストも更新
      }
    } catch (err) {
      console.error('連絡ステータスの更新に失敗しました:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // カードを非表示にする
      setCandidates(prev => prev.filter(c => c.id !== id))
      // 選択リストからも削除
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      // 全候補者リストも更新
      loadAllCandidates()
      }
    } catch (err) {
      console.error('削除に失敗しました:', err)
      alert('削除に失敗しました')
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('削除する候補者を選択してください')
      return
    }

    if (!confirm(`${selectedIds.length}件の候補者を削除してもよろしいですか？`)) {
      return
    }

    try {
      // 並列で削除
      await Promise.all(
        selectedIds.map(id => 
          fetch(`/api/candidates/${id}`, { method: 'DELETE' })
        )
      )
      
      // カードを非表示にする
      setCandidates(prev => prev.filter(c => !selectedIds.includes(c.id)))
      setSelectedIds([])
      setDeleteMode(false)
      // 全候補者リストも更新
      loadAllCandidates()
    } catch (err) {
      console.error('一括削除に失敗しました:', err)
      alert('一括削除に失敗しました')
    }
  }

  const handleToggleDeleteMode = () => {
    setDeleteMode(prev => !prev)
    setSelectedIds([]) // 削除モードを切り替える際に選択をリセット
  }

  const handleFinishReview = () => {
    setIsModalOpen(true)
  }

  const filteredCandidates = candidates.filter(c => c.status === currentStatus)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">スカウト候補者管理</h1>
          <a
            href="/stats"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            📊 統計・グラフ
          </a>
        </div>
      </div>

      <StatusTabs currentStatus={currentStatus} onStatusChange={setCurrentStatus} />
      
      {/* 削除モードとソート機能のヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span>ソート:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="oldest">古い順</option>
                <option value="newest">最新順</option>
              </select>
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            {deleteMode && (
              <>
                <span className="text-sm text-gray-600">
                  選択中: {selectedIds.length}件
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  一括削除
                </button>
                <button
                  onClick={handleToggleDeleteMode}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
                >
                  キャンセル
                </button>
              </>
            )}
            {!deleteMode && (
              <button
                onClick={handleToggleDeleteMode}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors flex items-center gap-2"
              >
                <span>🗑️</span>
                <span>削除モード</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 音声スイッチ（右上に固定） */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 border-2 border-gray-200">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
            isMuted
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isMuted ? '音声をONにする' : '音声をOFFにする'}
        >
          <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
          <span className="text-sm font-semibold">{isMuted ? '音声OFF' : '音声ON'}</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL入力フォーム（ローカル環境のみ表示） */}
        {isLocalEnvironment && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="TikTokのURLを入力してください"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            <button
              type={isLoading && isHoveringLoading ? 'button' : 'submit'}
              onClick={isLoading && isHoveringLoading ? handleCancelLoading : undefined}
              disabled={isLoading && !isHoveringLoading}
              onMouseEnter={() => setIsHoveringLoading(true)}
              onMouseLeave={() => setIsHoveringLoading(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isLoading ? (
                isHoveringLoading ? (
                  <>
                    <span>❌</span>
                    <span>キャンセル</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block animate-spin text-xl">⏳</span>
                    <span className="animate-pulse">ローディング{loadingDots}</span>
                  </>
                )
              ) : (
                '登録'
              )}
            </button>
            </div>
            
            {/* 性別選択 */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">性別:</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value as 'male')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">男性</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value as 'female')}
                    className="w-4 h-4 text-pink-600"
                  />
                  <span className="text-sm text-gray-700">女性</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={gender === 'other'}
                    onChange={(e) => setGender(e.target.value as 'other')}
                    className="w-4 h-4 text-gray-600"
                  />
                  <span className="text-sm text-gray-700">その他</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value=""
                    checked={gender === null}
                    onChange={() => setGender(null)}
                    className="w-4 h-4 text-gray-400"
                  />
                  <span className="text-sm text-gray-500">未設定（登録不可）</span>
                </label>
              </div>
            </div>
            
            {/* 紹介者情報 */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReferrer}
                  onChange={(e) => setHasReferrer(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">👤 紹介者がいる</span>
              </label>
              
              {hasReferrer && (
                <div className="space-y-3 pl-7">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      紹介者名:
                    </label>
                    <input
                      type="text"
                      value={referrerName}
                      onChange={(e) => setReferrerName(e.target.value)}
                      placeholder="例: ベスタさん"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      紹介者メモ:
                    </label>
                    <textarea
                      value={referrerMemo}
                      onChange={(e) => setReferrerMemo(e.target.value)}
                      placeholder="例: 学校の先生、ミュージシャン"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 whitespace-pre-line text-sm">
              {error}
            </div>
          )}
        </div>
        )}
        
        {/* Vercel環境では閲覧専用メッセージを表示 */}
        {!isLocalEnvironment && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👁️</span>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">閲覧専用モード</h3>
                <p className="text-sm text-blue-800">
                  この環境では候補者の閲覧・編集のみ可能です。新規登録はローカル環境で行ってください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 候補者グリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id}>
              <CandidateCard 
                candidate={candidate} 
                onJudge={handleJudge}
                onUpdateContactStatus={candidate.status === 'contact' ? handleUpdateContactStatus : undefined}
                isMuted={isMuted}
                globalNumber={getGenderNumber(candidate.id, candidate.gender)}
                deleteMode={deleteMode}
                isSelected={selectedIds.includes(candidate.id)}
                onToggleSelect={() => handleToggleSelect(candidate.id)}
              />
            </div>
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            候補者がありません
          </div>
        )}
      </div>

      {/* レビュー完了ボタン */}
      <button
        onClick={handleFinishReview}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg font-medium transition-colors"
      >
        レビュー完了
      </button>

      {/* モーダル */}
      <FinishReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summary={{
          contact: processedCounts.contact,
          stay: processedCounts.stay,
          pass: processedCounts.pass,
          total: processedCounts.contact + processedCounts.stay + processedCounts.pass,
        }}
        lastUpdated={new Date().toISOString()}
      />
    </div>
  )
}
