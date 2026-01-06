'use client'

import { useState, useEffect } from 'react'
import { Candidate } from '@/lib/data'
import Link from 'next/link'

export default function StatsPage() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([])

  useEffect(() => {
    loadAllCandidates()
  }, [])

  const loadAllCandidates = async () => {
    try {
      const response = await fetch('/api/candidates')
      const data = await response.json()
      setAllCandidates(data)
    } catch (err) {
      console.error('候補者の読み込みに失敗しました:', err)
    }
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

  // 日付別の登録数を計算
  const getDailyStats = () => {
    const dailyMap = new Map<string, { total: number, male: number, female: number, other: number }>()
    
    allCandidates.forEach(candidate => {
      const date = new Date(candidate.createdAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { total: 0, male: 0, female: 0, other: 0 })
      }
      
      const dayStats = dailyMap.get(date)!
      dayStats.total++
      
      if (candidate.gender === 'male') {
        dayStats.male++
      } else if (candidate.gender === 'female') {
        dayStats.female++
      } else {
        dayStats.other++
      }
    })
    
    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const statistics = getStatistics()
  const dailyStats = getDailyStats()
  const maxDailyCount = Math.max(...dailyStats.map(d => d.total), 1)

  // 男女比率を計算
  const genderRatio = {
    male: statistics.male > 0 ? (statistics.male / (statistics.male + statistics.female) * 100).toFixed(1) : '0',
    female: statistics.female > 0 ? (statistics.female / (statistics.male + statistics.female) * 100).toFixed(1) : '0',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">統計・グラフ</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 性別別の統計 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">性別別の統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-blue-600 font-semibold text-lg mb-2">男性</div>
              <div className="text-4xl font-bold text-blue-700 mb-2">{statistics.male}人</div>
              {statistics.male + statistics.female > 0 && (
                <div className="text-sm text-blue-600">全体の{genderRatio.male}%</div>
              )}
            </div>
            <div className="bg-pink-50 p-6 rounded-lg">
              <div className="text-pink-600 font-semibold text-lg mb-2">女性</div>
              <div className="text-4xl font-bold text-pink-700 mb-2">{statistics.female}人</div>
              {statistics.male + statistics.female > 0 && (
                <div className="text-sm text-pink-600">全体の{genderRatio.female}%</div>
              )}
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-gray-600 font-semibold text-lg mb-2">その他/未設定</div>
              <div className="text-4xl font-bold text-gray-700 mb-2">{statistics.other}人</div>
            </div>
          </div>
        </div>

        {/* ステータス別の統計 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">ステータス別の統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-gray-600 font-semibold mb-2">📁 未チェック</div>
              <div className="text-3xl font-bold text-gray-900">{statistics.byStatus.unreviewed}人</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-semibold mb-2">📁 連絡する</div>
              <div className="text-3xl font-bold text-green-700">{statistics.byStatus.contact}人</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-yellow-600 font-semibold mb-2">📁 保留</div>
              <div className="text-3xl font-bold text-yellow-700">{statistics.byStatus.stay}人</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-red-600 font-semibold mb-2">📁 NG</div>
              <div className="text-3xl font-bold text-red-700">{statistics.byStatus.pass}人</div>
            </div>
          </div>
        </div>

        {/* 男女比率の円グラフ */}
        {statistics.male + statistics.female > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">男女比率</h2>
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                <svg className="transform -rotate-90 w-64 h-64">
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="40"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="40"
                    strokeDasharray={`${2 * Math.PI * 100 * (statistics.male / (statistics.male + statistics.female))} ${2 * Math.PI * 100}`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="40"
                    strokeDasharray={`${2 * Math.PI * 100 * (statistics.female / (statistics.male + statistics.female))} ${2 * Math.PI * 100}`}
                    strokeDashoffset={`-${2 * Math.PI * 100 * (statistics.male / (statistics.male + statistics.female))}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{statistics.male + statistics.female}</div>
                    <div className="text-sm text-gray-600">人</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">男性 {genderRatio.male}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <span className="text-sm">女性 {genderRatio.female}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 日付別の登録数グラフ */}
        {dailyStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">日付別の登録数</h2>
            <div className="space-y-4">
              {dailyStats.map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600 font-medium">{day.date}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 h-8">
                      {day.male > 0 && (
                        <div
                          className="bg-blue-500 h-full rounded-l flex items-center justify-end pr-2"
                          style={{ width: `${(day.male / maxDailyCount) * 100}%` }}
                        >
                          {day.male > 0 && <span className="text-white text-xs font-semibold">{day.male}</span>}
                        </div>
                      )}
                      {day.female > 0 && (
                        <div
                          className="bg-pink-500 h-full flex items-center justify-end pr-2"
                          style={{ width: `${(day.female / maxDailyCount) * 100}%` }}
                        >
                          {day.female > 0 && <span className="text-white text-xs font-semibold">{day.female}</span>}
                        </div>
                      )}
                      {day.other > 0 && (
                        <div
                          className="bg-gray-400 h-full rounded-r flex items-center justify-end pr-2"
                          style={{ width: `${(day.other / maxDailyCount) * 100}%` }}
                        >
                          {day.other > 0 && <span className="text-white text-xs font-semibold">{day.other}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-gray-700">
                    {day.total}人
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>男性</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <span>女性</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>その他/未設定</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
