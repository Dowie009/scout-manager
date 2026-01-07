'use client'

interface StatusTabsProps {
  currentStatus: 'unreviewed' | 'contact' | 'stay' | 'pass'
  onStatusChange: (status: 'unreviewed' | 'contact' | 'stay' | 'pass') => void
}

const tabs = [
  { id: 'unreviewed' as const, label: '📁 未チェック' },
  { id: 'contact' as const, label: '📁 連絡する' },
  { id: 'stay' as const, label: '📁 保留' },
  { id: 'pass' as const, label: '📁 NG' },
]

export default function StatusTabs({ currentStatus, onStatusChange }: StatusTabsProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* iPhone向け: グリッドレイアウト（2x2） */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-4 py-4 sm:px-8 sm:py-6 font-bold text-base sm:text-lg transition-all rounded-lg sm:rounded-none ${
                currentStatus === tab.id
                  ? 'text-blue-600 bg-blue-50 border-2 border-blue-600 shadow-md sm:border-b-4 sm:border-t-0 sm:border-l-0 sm:border-r-0 sm:shadow-none'
                  : 'text-gray-600 bg-gray-50 border-2 border-gray-200 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
