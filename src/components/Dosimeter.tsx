import { useMemo, useState } from 'react'
import type { MeterStats } from '../types'
import { computeDose, computeTWA, DOSE_STANDARDS, type DoseStandard } from '../lib/reference'

interface DosimeterProps {
  stats: MeterStats
  elapsedMs: number
  isListening: boolean
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function Dosimeter({ stats, elapsedMs, isListening }: DosimeterProps) {
  const [standard, setStandard] = useState<DoseStandard>(DOSE_STANDARDS[1]) // NIOSH default

  const dose = useMemo(() => {
    if (stats.avg === -Infinity || elapsedMs <= 0) return 0
    const hours = elapsedMs / (1000 * 60 * 60)
    return computeDose(stats.avg, hours, standard)
  }, [stats.avg, elapsedMs, standard])

  const twa = useMemo(() => {
    if (stats.avg === -Infinity || elapsedMs <= 0) return 0
    const hours = elapsedMs / (1000 * 60 * 60)
    return computeTWA(stats.avg, hours, standard)
  }, [stats.avg, elapsedMs, standard])

  const doseColor = dose >= 100 ? '#ef4444' : dose >= 50 ? '#f97316' : dose >= 25 ? '#eab308' : '#22c55e'
  const remainingTime = useMemo(() => {
    if (stats.avg < standard.threshold) return Infinity
    const hours = elapsedMs / (1000 * 60 * 60)
    if (dose <= 0) return Infinity
    const totalFor100 = (hours / dose) * 100
    return Math.max(0, (totalFor100 - hours) * 3600 * 1000)
  }, [stats.avg, elapsedMs, dose, standard])

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto pb-4">
      {/* Standard selector */}
      <div className="flex gap-2">
        {DOSE_STANDARDS.map((s) => (
          <button
            key={s.name}
            onClick={() => setStandard(s)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
              standard.name === s.name
                ? 'bg-meter-glow/20 text-meter-glow border border-meter-glow/40'
                : 'bg-meter-surface text-slate-400 border border-meter-border'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Dose percentage - big display */}
      <div
        className="flex flex-col items-center justify-center py-8 rounded-xl border"
        style={{
          backgroundColor: `${doseColor}15`,
          borderColor: `${doseColor}40`,
        }}
      >
        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-2">Noise Dose</div>
        <div
          className="text-5xl font-bold tabular font-mono"
          style={{ color: doseColor, textShadow: `0 0 20px ${doseColor}40` }}
        >
          {dose.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {standard.name} standard · {standard.exchangeRate}dB exchange rate
        </div>
      </div>

      {/* Dose bar */}
      <div className="relative w-full h-3 rounded-full bg-meter-surface border border-meter-border overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, dose)}%`,
            backgroundColor: doseColor,
            boxShadow: `0 0 8px ${doseColor}80`,
          }}
        />
        {/* 100% marker */}
        <div className="absolute top-0 right-0 h-full w-px bg-white/30" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col p-3 rounded-lg bg-meter-surface border border-meter-border">
          <div className="text-[10px] text-slate-500 font-mono uppercase">Elapsed</div>
          <div className="text-xl font-mono tabular text-slate-200 mt-1">{formatDuration(elapsedMs)}</div>
        </div>
        <div className="flex flex-col p-3 rounded-lg bg-meter-surface border border-meter-border">
          <div className="text-[10px] text-slate-500 font-mono uppercase">LAeq (avg)</div>
          <div className="text-xl font-mono tabular text-slate-200 mt-1">
            {stats.avg === -Infinity ? '--' : stats.avg.toFixed(1) + ' dB'}
          </div>
        </div>
        <div className="flex flex-col p-3 rounded-lg bg-meter-surface border border-meter-border">
          <div className="text-[10px] text-slate-500 font-mono uppercase">TWA (8hr equiv)</div>
          <div
            className="text-xl font-mono tabular mt-1"
            style={{ color: twa >= standard.criterion ? '#ef4444' : '#e2e8f0' }}
          >
            {twa > 0 ? twa.toFixed(1) + ' dB' : '--'}
          </div>
        </div>
        <div className="flex flex-col p-3 rounded-lg bg-meter-surface border border-meter-border">
          <div className="text-[10px] text-slate-500 font-mono uppercase">Remaining to 100%</div>
          <div
            className="text-xl font-mono tabular mt-1"
            style={{ color: remainingTime === Infinity ? '#22c55e' : remainingTime < 3600000 ? '#ef4444' : '#e2e8f0' }}
          >
            {remainingTime === Infinity ? '∞' : formatDuration(remainingTime)}
          </div>
        </div>
      </div>

      {/* Warning */}
      {dose >= 100 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 fade-in">
          <span className="text-xl">⚠️</span>
          <span className="text-sm text-red-400">
            100% noise dose exceeded. Hearing protection recommended.
          </span>
        </div>
      )}

      {/* Info */}
      <div className="text-[11px] text-slate-600 leading-relaxed">
        {standard.name === 'OSHA'
          ? 'OSHA: 90 dB criterion, 5 dB exchange rate, 80 dB threshold. Occupational safety standard (US).'
          : 'NIOSH: 85 dB criterion, 3 dB exchange rate, 80 dB threshold. Recommended exposure limit (US).'}
        {isListening && stats.avg > -Infinity && (
          <> Current average: {stats.avg.toFixed(1)} dB(A).</>
        )}
      </div>
    </div>
  )
}
