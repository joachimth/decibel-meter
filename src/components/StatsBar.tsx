import { useMemo } from 'react'
import type { MeterStats } from '../types'

interface StatsBarProps {
  stats: MeterStats
  isListening: boolean
}

function fmt(db: number): string {
  if (db === -Infinity || db === Infinity || isNaN(db)) return '--'
  return db.toFixed(1)
}

export function StatsBar({ stats, isListening }: StatsBarProps) {
  const items = useMemo(
    () => [
      { label: 'MIN', value: stats.min, color: '#22c55e' },
      { label: 'AVG', value: stats.avg, color: '#00e5ff' },
      { label: 'MAX', value: stats.max, color: '#eab308' },
      { label: 'PEAK', value: stats.peak, color: '#ef4444' },
    ],
    [stats],
  )

  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center justify-center py-2 rounded-lg bg-meter-surface border border-meter-border"
        >
          <div
            className="text-lg font-bold tabular font-mono"
            style={{ color: isListening && item.value > -Infinity ? item.color : '#475569' }}
          >
            {fmt(item.value)}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
