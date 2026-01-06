'use client'

interface FinishReviewModalProps {
  isOpen: boolean
  onClose: () => void
  summary: {
    contact: number
    stay: number
    pass: number
    total: number
  }
  lastUpdated: string
}

export default function FinishReviewModal({
  isOpen,
  onClose,
  summary,
  lastUpdated,
}: FinishReviewModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6 text-center">レビュー完了</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">✅ 連絡する:</span>
            <span className="font-semibold text-green-600">{summary.contact}件</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">🤔 保留:</span>
            <span className="font-semibold text-yellow-600">{summary.stay}件</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">🚫 NG:</span>
            <span className="font-semibold text-red-600">{summary.pass}件</span>
          </div>
          <div className="border-t pt-4 flex justify-between items-center">
            <span className="text-gray-700 font-semibold">合計:</span>
            <span className="font-bold text-lg">{summary.total}件</span>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-6 text-center">
          最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
