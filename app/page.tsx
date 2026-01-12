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
  const [isMuted, setIsMuted] = useState(true) // デフォルトはミュート（iOS自動再生に必要）
  const [loadingDots, setLoadingDots] = useState('')
  const [deleteMode, setDeleteMode] = useState(false) // 削除モード
  const [selectedIds, setSelectedIds] = useState<string[]>([]) // 選択されたID
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('oldest') // ソート順
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]) // 全候補者（ナンバー計算用）
  const [abortController, setAbortController] = useState<AbortController | null>(null) // ローディングキャンセル用
  const [isHoveringLoading, setIsHoveringLoading] = useState(false) // ローディングボタンにホバー中か
  const [isLocalEnvironment, setIsLocalEnvironment] = useState(false) // ローカル環境かどうか
  const [isDeploying, setIsDeploying] = useState(false) // デプロイ中かどうか
  const [deployMessage, setDeployMessage] = useState('') // デプロイメッセージ
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid') // 表示モード（グリッド or リスト）
  const [isInitialLoading, setIsInitialLoading] = useState(true) // 初期ロード中かどうか

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

  // データのプリフェッチ（ページ読み込み時に事前取得）
  useEffect(() => {
    // 主要なAPIエンドポイントを事前に取得
    const prefetchData = async () => {
      try {
        await fetch('/api/candidates?status=unreviewed', { method: 'HEAD' })
        await fetch('/api/candidates?status=contact', { method: 'HEAD' })
      } catch (error) {
        // エラーは無視（プリフェッチなので）
      }
    }
    prefetchData()
  }, [])

  // 全候補者を読み込んで、全体での登録順を計算
  const loadAllCandidates = async () => {
    try {
      // キャッシュを無効化して常に最新データを取得
      const response = await fetch('/api/candidates', {
        cache: 'no-store',
      })
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
    // allCandidatesがまだ読み込まれていない場合、現在のcandidatesから計算を試みる
    const candidateList = allCandidates.length > 0 ? allCandidates : candidates

    if (candidateList.length === 0) {
      // まだデータがロードされていない場合は一時的に1を返す
      return 1
    }

    if (!candidateGender || candidateGender === 'other') {
      // 性別が未設定またはその他の場合、全体の順番を使用
      const sortedList = [...candidateList].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      const index = sortedList.findIndex(c => c.id === candidateId)
      return index >= 0 ? index + 1 : 1
    }

    // 性別が設定されている場合、その性別内での順番を計算
    const sameGenderCandidates = candidateList
      .filter(c => c.gender === candidateGender)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const index = sameGenderCandidates.findIndex(c => c.id === candidateId)
    return index >= 0 ? index + 1 : 1
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
      setIsInitialLoading(true) // ローディング開始
      // キャッシュを活用（ブラウザのキャッシュを使用）
      const response = await fetch(`/api/candidates?status=${currentStatus}`, {
        cache: 'force-cache', // キャッシュを優先
        next: { revalidate: 60 }, // 60秒後に再検証
      })
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
    } finally {
      setIsInitialLoading(false) // ローディング終了
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
    // Vercel環境（閲覧専用モード）では、連絡システムを起動
    if (!isLocalEnvironment) {
      // メール送信または連絡フォームを開く
      const email = 'mashibamashiba@gmail.com'
      const subject = encodeURIComponent('スカウト候補者レビュー完了のご連絡')
      const body = encodeURIComponent(`レビューが完了しました。\n\nご確認をお願いいたします。`)
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    } else {
      // ローカル環境では通常のモーダルを表示（ただし非表示なので実行されない）
      setIsModalOpen(true)
    }
  }

  const handleDeployToVercel = async () => {
    setIsDeploying(true)
    setDeployMessage('')
    
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      
      if (data.success) {
        setDeployMessage('✅ デプロイが開始されました！Vercelで確認してください。')
      } else {
        setDeployMessage(`❌ エラー: ${data.message || 'デプロイに失敗しました'}`)
      }
    } catch (error: any) {
      setDeployMessage(`❌ エラー: ${error.message || 'デプロイに失敗しました'}`)
    } finally {
      setIsDeploying(false)
    }
  }

  const filteredCandidates = candidates.filter(c => c.status === currentStatus)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 初回ローディング表示 */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">読み込み中...</p>
            <p className="text-gray-400 text-sm mt-2">初回アクセス時は数秒かかることがあります</p>
          </div>
        </div>
      )}
      {/* ナビゲーションバー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <h1 className="text-xl font-bold text-gray-900 mb-3">スカウト候補者管理 <span className="text-sm font-normal text-gray-400">v1.0.20</span></h1>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/stats"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors text-sm sm:text-base"
            >
              📊 統計・グラフ
            </a>
            {/* デプロイボタン（ローカル環境のみ表示） */}
            {isLocalEnvironment && (
              <button
                onClick={handleDeployToVercel}
                disabled={isDeploying}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm sm:text-base ${
                  isDeploying
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                title="Vercelにデプロイ"
              >
                <span className="text-lg">{isDeploying ? '⏳' : '☁️'}</span>
                <span className="text-sm font-semibold">
                  {isDeploying ? 'デプロイ中...' : 'Vercelにデプロイ'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <StatusTabs currentStatus={currentStatus} onStatusChange={setCurrentStatus} />
      
      {/* 削除モードとソート機能のヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
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
            
            {/* 表示モード切り替え（全ホルダーに表示） */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="グリッド表示（大）"
              >
                <span className="text-lg">⊞</span>
                <span className="text-xs font-bold">大</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="リスト表示（小）"
              >
                <span className="text-lg">☰</span>
                <span className="text-xs font-bold">小</span>
              </button>
            </div>
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
      
      {/* 音声スイッチ（右上に固定、iPhone対応） */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 sm:p-3 flex items-center gap-2 border-2 border-gray-200">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md font-medium transition-colors flex items-center gap-1 sm:gap-2 ${
            isMuted
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isMuted ? '音声をONにする' : '音声をOFFにする'}
        >
          <span className="text-lg sm:text-xl">{isMuted ? '🔇' : '🔊'}</span>
          <span className="text-xs sm:text-sm font-semibold hidden sm:inline">{isMuted ? '音声OFF' : '音声ON'}</span>
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
              <h3 className="font-bold text-blue-900">閲覧専用モード</h3>
            </div>
          </div>
        )}

        {/* 候補者表示（ローディング完了後のみ表示） */}
        {!isInitialLoading && viewMode === 'list' ? (
          // リスト表示（全ホルダー対応）
          <div className="space-y-3">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`bg-white rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow ${
                  deleteMode && selectedIds.includes(candidate.id) ? 'ring-4 ring-red-500' : ''
                }`}
              >
                {/* 削除モード時のチェックボックス */}
                {deleteMode && (
                  <div 
                    className="flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={() => handleToggleSelect(candidate.id)}
                      className="w-6 h-6 cursor-pointer accent-red-600 border-2 border-gray-300 rounded"
                    />
                  </div>
                )}
                
                {/* サムネイル */}
                <div className="w-20 h-32 sm:w-24 sm:h-36 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 relative">
                  {candidate.iconPath && candidate.iconPath !== '' && !candidate.iconPath.startsWith('http') ? (
                    <img
                      src={candidate.iconPath}
                      alt={candidate.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                  {/* シャープナンバー */}
                  <div 
                    className={`absolute top-1 left-1 text-white px-2 py-0.5 rounded text-xs font-bold ${
                      candidate.gender === 'female' 
                        ? 'bg-pink-500' 
                        : candidate.gender === 'male'
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                    }`}
                  >
                    #{getGenderNumber(candidate.id, candidate.gender)}
                  </div>
                  {candidate.hasReferrer && (
                    <div className="absolute top-1 right-1">
                      <span className="text-xs font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded shadow-md">⭐</span>
                    </div>
                  )}
                </div>
                
                {/* 情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{candidate.username}</h3>
                    {candidate.hasReferrer && (
                      <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded flex-shrink-0">⭐ 紹介者</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(candidate.createdAt).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 登録
                  </div>
                  {candidate.memo && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{candidate.memo}</p>
                  )}
                  {candidate.hasReferrer && candidate.referrerName && (
                    <div className="text-xs text-yellow-700 mb-1">
                      <span className="font-semibold">紹介者:</span> {candidate.referrerName}
                    </div>
                  )}
                  {candidate.hasReferrer && candidate.referrerMemo && (
                    <div className="text-xs text-yellow-800 bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                      {candidate.referrerMemo}
                    </div>
                  )}
                </div>
                
                {/* アクション */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <span>🔗</span>
                    <span className="hidden sm:inline">プロフィール</span>
                  </a>
                  {!deleteMode && (
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md font-medium transition-colors"
                    >
                      🗑️ 削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !isInitialLoading ? (
          // グリッド表示（通常）
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id}>
                <CandidateCard
                  candidate={candidate}
                  onJudge={handleJudge}
                  onUpdateContactStatus={candidate.status === 'contact' ? handleUpdateContactStatus : undefined}
                  isMuted={isMuted}
                  globalNumber={getGenderNumber(candidate.id, candidate.gender)}
                  genderNumber={getGenderNumber(candidate.id, candidate.gender)}
                  deleteMode={deleteMode}
                  isSelected={selectedIds.includes(candidate.id)}
                  onToggleSelect={() => handleToggleSelect(candidate.id)}
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* ローディング中の表示 */}
        {isInitialLoading && (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center gap-4">
              {/* スピナーアニメーション */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gray-200 border-b-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                </div>
              </div>
              <div className="text-gray-600 text-lg font-medium">
                データを読み込んでいます...
              </div>
              <div className="text-gray-400 text-sm">
                しばらくお待ちください
              </div>
            </div>
          </div>
        )}

        {/* データがない場合の表示（ローディング完了後） */}
        {!isInitialLoading && filteredCandidates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            候補者がありません
          </div>
        )}
      </div>

      {/* レビュー完了ボタン（Vercel環境のみ表示） */}
      {!isLocalEnvironment && (
        <button
          onClick={handleFinishReview}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg font-medium transition-colors z-40"
        >
          レビュー完了
        </button>
      )}

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
