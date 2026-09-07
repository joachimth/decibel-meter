import { useMemo } from 'react'
import type { HistorySample } from '../types'

interface HistoryGraphProps {
  history: HistorySample[]
  isListening: boolean
  minDisplay: number
  maxDisplay: number
}

export function HistoryGraph({ history, isListening, minDisplay, maxDisplay }: HistoryGraphProps) {
  const { pathD, areaD, maxLine, minLine, avgLine } = useMemo(() => {
    if (history.length < 2) {
      return { pathD: '', areaD: '', maxLine: 0, minLine: 0, avgLine: 0 }
    }

    const width = 100
    const height = 100
    const range = maxDisplay - minDisplay

    const tMin = history[0].t
    const tMax = history[history.length - 1].t
    const tRange = Math.max(1, tMax - tMin)

    const points = history.map((s) => {
      const x = ((s.t - tMin) / tRange) * width
      const clampedDb = Math.max(minDisplay, Math.min(maxDisplay, s.db === -Infinity ? minDisplay : s.db))
      const y = height - ((clampedDb - minDisplay) / range) * height
      return { x, y, db: s.db }
    })

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    const area = `${path} L ${width} ${height} L 0 ${height} Z`

    const validDbs = history.filter((s) => s.db > -Infinity).map((s) => s.db)
    const max = validDbs.length > 0 ? Math.max(...validDbs) : 0
    const min = validDbs.length > 0 ? Math.min(...validDbs) : 0
    const avg = validDbs.length > 0 ? validDbs.reduce((a, b) => a + b, 0) / validDbs.length : 0

    return {
      pathD: path,
      areaD: area,
      maxLine: height - ((Math.max(minDisplay, Math.min(maxDisplay, max)) - minDisplay) / range) * height,
      minLine: height - ((Math.max(minDisplay, Math.min(maxDisplay, min)) - minDisplay) / range) * height,
      avgLine: height - ((Math.max(minDisplay, Math.min(maxDisplay, avg)) - minDisplay) / range) * height,
    }
  }, [history, minDisplay, maxDisplay])

  const validDbs = history.filter((s) => s.db > -Infinity)
  const duration = history.length > 1 ? (history[history.length - 1].t - history[0].t) / 1000 : 0

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-1 min-h-0">
        {/* dB scale */}
        <div className="flex flex-col justify-between w-10 py-1 text-[9px] text-slate-500 font-mono text-right pr-1">
          <span>{maxDisplay}</span>
          <span>{Math.round(maxDisplay - (maxDisplay - minDisplay) * 0.25)}</span>
          <span>{Math.round(maxDisplay - (maxDisplay - minDisplay) * 0.5)}</span>
          <span>{Math.round(maxDisplay - (maxDisplay - minDisplay) * 0.75)}</span>
          <span>{minDisplay}</span>
        </div>
        <div className="relative flex-1 border-l border-slate-800 bg-black/20">
          {history.length < 2 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              {isListening ? 'Collecting data...' : 'Start measurement to see history'}
            </div>
          ) : (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#1e2530" strokeWidth="0.3" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#1e2530" strokeWidth="0.3" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#1e2530" strokeWidth="0.3" />

              {/* Max line */}
              <line x1="0" y1={maxLine} x2="100" y2={maxLine} stroke="#ef4444" strokeWidth="0.3" strokeDasharray="2,1" opacity="0.5" />
              {/* Min line */}
              <line x1="0" y1={minLine} x2="100" y2={minLine} stroke="#22c55e" strokeWidth="0.3" strokeDasharray="2,1" opacity="0.5" />
              {/* Avg line */}
              <line x1="0" y1={avgLine} x2="100" y2={avgLine} stroke="#00e5ff" strokeWidth="0.3" strokeDasharray="2,1" opacity="0.4" />

              {/* Area fill */}
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#histGrad)" />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
                style={{ filter: 'drop-shadow(0 0 2px #00e5ff60)' }}
              />
            </svg>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between ml-10 px-2 h-5 text-[9px] text-slate-500 font-mono">
        <span>{duration.toFixed(0)}s</span>
        <span>{validDbs.length} samples</span>
      </div>
    </div>
  )
}
