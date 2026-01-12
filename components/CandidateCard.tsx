'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { Candidate } from '@/lib/data'

interface CandidateCardProps {
  candidate: Candidate
  onJudge: (id: string, status: 'contact' | 'stay' | 'pass', memo: string) => void
  onUpdateContactStatus?: (id: string, contactStatus: 'contacted' | 'no_response' | 'in_progress') => void
  isMuted: boolean // 全体の音声設定を受け取る
  globalNumber: number // 全体での登録順ナンバー
  genderNumber: number // 性別ごとのナンバー
  deleteMode: boolean // 削除モードかどうか
  isSelected: boolean // 選択されているかどうか
  onToggleSelect: () => void // 選択の切り替え
}

function CandidateCard({ candidate, onJudge, onUpdateContactStatus, isMuted, globalNumber, genderNumber, deleteMode, isSelected, onToggleSelect }: CandidateCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false) // タップで再生/停止用（モバイル対応）
  const [memo, setMemo] = useState('')
  const [isJudging, setIsJudging] = useState(false)
  const [isUpdatingContactStatus, setIsUpdatingContactStatus] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null) // Vercel環境用の動画URL
  
  // YouTube URLかどうかを判定（videoPathまたはurlをチェック）
  const isYouTubeUrl = (): boolean => {
    // videoPathとurlの両方をチェック
    const videoPath = candidate.videoPath || ''
    const url = candidate.url || ''
    return videoPath.includes('youtube.com') || videoPath.includes('youtu.be') || 
           url.includes('youtube.com') || url.includes('youtu.be')
  }
  
  // YouTube URLから動画IDを抽出
  const getYouTubeVideoId = (): string | null => {
    // videoPathとurlの両方をチェック（urlを優先）
    const urlToCheck = candidate.url || candidate.videoPath || ''
    
    // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
    const shortsMatch = urlToCheck.match(/youtube\.com\/shorts\/([^/?]+)/)
    if (shortsMatch) return shortsMatch[1]
    
    // 通常のYouTube: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = urlToCheck.match(/youtube\.com\/watch\?v=([^&]+)/)
    if (watchMatch) return watchMatch[1]
    
    // 短縮URL: https://youtu.be/VIDEO_ID
    const shortMatch = urlToCheck.match(/youtu\.be\/([^/?]+)/)
    if (shortMatch) return shortMatch[1]
    
    return null
  }
  
  // YouTube埋め込みURLを生成
  const getYouTubeEmbedUrl = (): string | null => {
    const videoId = getYouTubeVideoId()
    if (!videoId) return null
    // 自動再生を有効化（ただし、ブラウザのポリシーにより制限される場合あり）
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&playsinline=1`
  }

  // Vercel環境で登録された候補者の場合、動画URLを取得
  useEffect(() => {
    if (candidate.videoPath.startsWith('http') && isHovered && !videoUrl) {
      // TikTokの動画URLから直接再生可能なURLを取得（試行）
      // 注意: TikTokのCORS制限により、直接再生できない可能性が高い
      setVideoUrl(candidate.videoPath)
    }
  }, [candidate.videoPath, isHovered, videoUrl])

  // PC用：ホバーで再生制御
  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {})
      } else if (!isPlaying) {
        // ホバー解除時、タップ再生中でなければ停止
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [isHovered])

  // モバイル用：タップで再生/停止
  const handleVideoTap = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (deleteMode) return

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {})
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const handleJudge = async (status: 'contact' | 'stay' | 'pass') => {
    if (deleteMode) return // 削除モード中はジャッジできない
    setIsJudging(true)
    await onJudge(candidate.id, status, memo)
    setIsJudging(false)
  }

  const handleContactStatusUpdate = async (contactStatus: 'contacted' | 'no_response' | 'in_progress') => {
    if (!onUpdateContactStatus) return
    setIsUpdatingContactStatus(true)
    await onUpdateContactStatus(candidate.id, contactStatus)
    setIsUpdatingContactStatus(false)
  }

  // URLからユーザー名を抽出してTikTokプロフィールページのURLを生成
  const getProfileUrl = () => {
    const match = candidate.url.match(/@([^/?]+)/)
    if (match) {
      return `https://www.tiktok.com/@${match[1]}`
    }
    // URLから抽出できない場合は、usernameを使用
    return `https://www.tiktok.com/@${candidate.username}`
  }

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 relative ${
        candidate.hasReferrer
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-500 shadow-2xl ring-4 ring-yellow-300' // 紹介者がいる場合は特別なスタイル（縁取りを強調）
          : 'bg-white'
      } ${
        deleteMode ? '' : 'hover:shadow-xl hover:scale-[1.02]'
      } ${isSelected ? 'ring-4 ring-red-500' : ''}`}
      onMouseEnter={() => !deleteMode && setIsHovered(true)}
      onMouseLeave={() => !deleteMode && setIsHovered(false)}
    >
      {/* 紹介者がいる場合のバッジ */}
      {candidate.hasReferrer && (
        <div className="absolute top-2 right-2 z-30 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
          <span>⭐</span>
          <span>紹介者あり</span>
        </div>
      )}
      {/* 削除モード時のチェックボックス - 大きく目立つように */}
      {deleteMode && (
        <div 
          className="absolute top-4 left-4 z-50 bg-white rounded-lg p-2 shadow-2xl border-2 border-red-500"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-8 h-8 cursor-pointer accent-red-600 border-2 border-gray-300 rounded"
            style={{ 
              minWidth: '32px',
              minHeight: '32px',
              cursor: 'pointer'
            }}
          />
        </div>
      )}
      
      <div className="relative aspect-[9/16] bg-gray-100">
        {/* シャープナンバー（動画の左上に大きく表示、性別に応じて色を変更） */}
        {/* 性別ごとの番号を表示（女性#1, #2...、男性#1, #2...） */}
        {/* 削除モード時は右側に表示してチェックボックスと重ならないように */}
        <div
          className={`absolute ${deleteMode ? 'top-3 right-3' : 'top-3 left-3'} z-10 ${
            candidate.gender === 'female'
              ? 'bg-pink-500 bg-opacity-90'
              : candidate.gender === 'male'
              ? 'bg-blue-500 bg-opacity-90'
              : 'bg-gray-500 bg-opacity-90'
          } text-white px-3 py-1 rounded-md font-bold text-2xl shadow-lg`}
        >
          #{genderNumber}
        </div>
        
        {/* 紹介者バッジ（シャープナンバーの下に配置） */}
        {candidate.hasReferrer && !deleteMode && (
          <div 
            className={`absolute ${deleteMode ? 'top-16 right-3' : 'top-16 left-3'} z-10`}
          >
            <span className="text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-1 rounded shadow-md">直接紹介</span>
          </div>
        )}
        
        
        {/* YouTube URLの場合は埋め込みプレーヤーを使用 */}
        {isYouTubeUrl() ? (
          <div className="w-full h-full relative">
            {(() => {
              const embedUrl = getYouTubeEmbedUrl()
              const videoId = getYouTubeVideoId()
              
              if (!embedUrl || !videoId) {
                return (
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="text-4xl mb-2">📺</div>
                      <div className="font-bold text-lg mb-1">YouTube動画</div>
                      <div className="text-sm opacity-90">URLが無効です</div>
                    </div>
                  </div>
                )
              }
              
              // サムネイル画像（ホバーしていない時）
              if (!isHovered) {
                return (
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                    alt={candidate.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // サムネイルが取得できない場合はデフォルト画像
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    }}
                  />
                )
              }
              
              // ホバー時はYouTube埋め込みプレーヤーを表示
              return (
                <iframe
                  key={`youtube-${videoId}-${isHovered}`}
                  src={embedUrl}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                  title="YouTube video player"
                />
              )
            })()}
          </div>
        ) : candidate.videoPath.startsWith('http') ? (
          <div className="w-full h-full relative">
            {/* まず、既存の動画ファイルがあるか試す（Gitに含まれている場合） */}
            {/* 動画IDからファイル名を推測して試行 */}
            {(() => {
              const videoIdMatch = candidate.videoPath.match(/\/video\/(\d+)/)
              // 既存のファイル命名規則: video_timestamp.mp4
              // 実際のファイル名は分からないので、データベースに保存されたパスを使用
              // もしvideoPathがURLのままなら、動画ファイルはまだダウンロードされていない
              
              // サムネイル画像を表示
              if (candidate.iconPath && candidate.iconPath !== '' && !candidate.iconPath.startsWith('http')) {
                // アイコンパスがローカルファイルの場合
                return (
                  <>
                    <img
                      src={candidate.iconPath}
                      alt={candidate.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    {/* ホバー時にTikTokのページへのリンクを表示 */}
                    {isHovered && (
                      <a
                        href={candidate.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="bg-white rounded-lg px-6 py-3 text-gray-900 font-bold text-lg shadow-lg">
                          TikTokで開く →
                        </div>
                      </a>
                    )}
                  </>
                )
              } else {
                // アイコンパスが空またはURLの場合（Vercel環境で登録された場合）
                return (
                  <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="text-4xl mb-2">🎵</div>
                      <div className="font-bold text-lg mb-1">TikTok動画</div>
                      <div className="text-xs opacity-90 mb-2">
                        ⚠️ 動画ファイル未ダウンロード
                      </div>
                      <div className="text-sm opacity-90">
                        {isHovered ? 'クリックしてTikTokで開く' : 'ホバーで開く'}
                      </div>
                    </div>
                    {/* ホバー時にTikTokのページへのリンクを表示 */}
                    {isHovered && (
                      <a
                        href={candidate.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="bg-white rounded-lg px-6 py-3 text-gray-900 font-bold text-lg shadow-lg">
                          TikTokで開く →
                        </div>
                      </a>
                    )}
                  </div>
                )
              }
            })()}
          </div>
        ) : (
          <div
            onClick={handleVideoTap}
            className="w-full h-full cursor-pointer relative"
          >
            {/* 動画 - 常に表示、ホバー/タップで再生 */}
            <video
              ref={videoRef}
              src={candidate.videoPath}
              muted={isMuted}
              loop
              playsInline
              preload="auto"
              webkit-playsinline="true"
              className="w-full h-full object-cover"
            />
            {/* サムネイル - ホバーでも再生中でもない時のみ表示（動画の上に被せる） */}
            {!isHovered && !isPlaying && candidate.iconPath && (
              <img
                src={candidate.iconPath}
                alt={candidate.username}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{candidate.username}</h3>
          </div>
          <a
            href={getProfileUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors flex items-center gap-1"
            title="TikTokプロフィールを開く"
          >
            <span>🔗</span>
            <span>プロフィール</span>
          </a>
        </div>
        
        {/* 登録日時（小さく表示） */}
        <div className="text-xs text-gray-500 mb-2">
          {new Date(candidate.createdAt).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })} 登録
        </div>
        
        {/* 紹介者情報（紹介者がいる場合） */}
        {candidate.hasReferrer && (
          <div className="mb-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-r">
            {candidate.referrerName && (
              <div className="text-sm font-bold text-yellow-900 mb-1">
                紹介者: {candidate.referrerName}
              </div>
            )}
            {candidate.referrerMemo && (
              <div className="text-sm text-yellow-800 whitespace-pre-wrap">
                {candidate.referrerMemo}
              </div>
            )}
          </div>
        )}
        
        {!deleteMode && (
          <div className="space-y-3">
            {/* 連絡するフォルダの場合、詳細ステータスボタンを表示 */}
            {candidate.status === 'contact' && onUpdateContactStatus ? (
              <>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleContactStatusUpdate('contacted')}
                    disabled={isUpdatingContactStatus}
                    className={`flex-1 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center ${
                      candidate.contactStatus === 'contacted'
                        ? 'bg-green-600 text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-400 px-2 py-1.5 rounded-md text-xs opacity-60 hover:opacity-80 scale-90'
                    }`}
                  >
                    <span>送信</span>
                    <span>済み</span>
                  </button>
                  <button
                    onClick={() => handleContactStatusUpdate('no_response')}
                    disabled={isUpdatingContactStatus}
                    className={`flex-1 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center ${
                      candidate.contactStatus === 'no_response'
                        ? 'bg-orange-600 text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-400 px-2 py-1.5 rounded-md text-xs opacity-60 hover:opacity-80 scale-90'
                    }`}
                  >
                    <span>返信</span>
                    <span>OUT</span>
                  </button>
                  <button
                    onClick={() => handleContactStatusUpdate('in_progress')}
                    disabled={isUpdatingContactStatus}
                    className={`flex-1 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center ${
                      candidate.contactStatus === 'in_progress'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-400 px-2 py-1.5 rounded-md text-xs opacity-60 hover:opacity-80 scale-90'
                    }`}
                  >
                    <span>🎉</span>
                    <span>進展中</span>
                  </button>
                </div>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="メモを入力..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleJudge('contact')}
                    disabled={isJudging}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✅ 連絡する
                  </button>
                  <button
                    onClick={() => handleJudge('stay')}
                    disabled={isJudging}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🤔 保留
                  </button>
                  <button
                    onClick={() => handleJudge('pass')}
                    disabled={isJudging}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🚫 NG
                  </button>
                </div>
                
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="メモを入力..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </>
            )}
          </div>
        )}
        
        {deleteMode && (
          <div className="text-center py-4 text-gray-500">
            削除する場合はチェックを入れてください
          </div>
        )}
      </div>
    </div>
  )
}

// React.memoでメモ化（不要な再レンダリングを防ぐ）
export default memo(CandidateCard, (prevProps, nextProps) => {
  // 重要なプロップのみ比較
  return (
    prevProps.candidate.id === nextProps.candidate.id &&
    prevProps.candidate.status === nextProps.candidate.status &&
    prevProps.candidate.memo === nextProps.candidate.memo &&
    prevProps.candidate.contactStatus === nextProps.candidate.contactStatus &&
    prevProps.isMuted === nextProps.isMuted &&
    prevProps.deleteMode === nextProps.deleteMode &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.globalNumber === nextProps.globalNumber
  )
})
