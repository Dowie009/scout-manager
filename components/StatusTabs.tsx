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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-8 py-6 font-bold text-lg transition-all ${
                currentStatus === tab.id
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
