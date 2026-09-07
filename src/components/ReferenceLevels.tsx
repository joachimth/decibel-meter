import { REFERENCE_LEVELS } from '../lib/reference'

interface ReferenceLevelsProps {
  currentDb: number
  isListening: boolean
}

export function ReferenceLevels({ currentDb, isListening }: ReferenceLevelsProps) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md mx-auto pb-4">
      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">
        Sound Level Reference
      </div>
      {REFERENCE_LEVELS.map((level) => {
        const isCurrent =
          isListening &&
          currentDb > -Infinity &&
          Math.abs(currentDb - level.db) < 3
        const isNearestBelow =
          isListening &&
          currentDb > -Infinity &&
          currentDb >= level.db &&
          (REFERENCE_LEVELS[REFERENCE_LEVELS.indexOf(level) + 1]?.db ?? Infinity) > currentDb

        return (
          <div
            key={level.db}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              isCurrent || isNearestBelow
                ? 'bg-meter-surface border-meter-glow/40'
                : 'bg-meter-surface/50 border-meter-border/50'
            }`}
          >
            {/* Level bar */}
            <div
              className="w-2 h-10 rounded-full flex-shrink-0"
              style={{
                backgroundColor: level.color,
                opacity: isCurrent || isNearestBelow ? 1 : 0.4,
                boxShadow: isCurrent ? `0 0 8px ${level.color}` : 'none',
              }}
            />
            {/* dB */}
            <div
              className="text-lg font-mono font-bold tabular w-12 text-right"
              style={{ color: isCurrent || isNearestBelow ? level.color : '#64748b' }}
            >
              {level.db}
            </div>
            {/* Label + examples */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className={`text-sm font-medium ${isCurrent || isNearestBelow ? 'text-slate-200' : 'text-slate-500'}`}>
                {level.label}
              </div>
              <div className="text-[11px] text-slate-600 truncate">{level.examples}</div>
            </div>
            {/* Current indicator */}
            {isCurrent && (
              <div className="flex items-center gap-1 text-[10px] text-meter-glow font-mono rec-pulse">
                <span>●</span>
                <span>NOW</span>
              </div>
            )}
          </div>
        )
      })}

      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-slate-500 leading-relaxed mt-2">
        <span className="text-red-400 font-medium">⚠️ Hearing safety:</span> Prolonged exposure above 85 dB(A) can cause permanent hearing damage. Use hearing protection in noisy environments. OSHA limits: 8h at 90 dB, 2h at 100 dB, 15min at 115 dB.
      </div>
    </div>
  )
}
