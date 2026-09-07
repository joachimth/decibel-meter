import { useMemo } from 'react'
import type { MeterSettings } from '../types'

interface GaugeProps {
  db: number
  peak: number
  settings: MeterSettings
  isListening: boolean
}

function dbToColor(db: number): string {
  if (db < 60) return '#22c55e'
  if (db < 80) return '#eab308'
  if (db < 100) return '#f97316'
  return '#ef4444'
}

export function Gauge({ db, peak, settings, isListening }: GaugeProps) {
  const { minDisplay, maxDisplay } = settings
  const range = maxDisplay - minDisplay

  const clampedDb = Math.max(minDisplay - 10, Math.min(maxDisplay + 5, db === -Infinity ? minDisplay : db))
  const clampedPeak = Math.max(minDisplay, Math.min(maxDisplay, peak === -Infinity ? minDisplay : peak))

  // Arc: from -120deg to +120deg (240deg sweep)
  const startAngle = -120
  const endAngle = 120
  const totalSweep = endAngle - startAngle

  const dbToAngle = (val: number) => {
    const pct = (val - minDisplay) / range
    return startAngle + pct * totalSweep
  }

  const needleAngle = dbToAngle(clampedDb)
  const peakAngle = dbToAngle(clampedPeak)

  // Tick marks every 10 dB
  const ticks = useMemo(() => {
    const arr: { db: number; angle: number; major: boolean }[] = []
    for (let d = minDisplay; d <= maxDisplay; d += 5) {
      arr.push({ db: d, angle: dbToAngle(d), major: d % 10 === 0 })
    }
    return arr
  }, [minDisplay, maxDisplay, range]) // eslint-disable-line react-hooks/exhaustive-deps

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: 150 + radius * Math.cos(rad), y: 150 + radius * Math.sin(rad) }
  }

  const describeArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(startAngle, radius)
    const end = polarToCartesian(endAngle, radius)
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  const color = dbToColor(db === -Infinity ? minDisplay : db)
  const displayDb = db === -Infinity ? '--' : db.toFixed(1)

  // Arc segments for color zones
  const zones = [
    { from: minDisplay, to: Math.min(60, maxDisplay), color: '#22c55e' },
    { from: Math.max(minDisplay, 60), to: Math.min(80, maxDisplay), color: '#eab308' },
    { from: Math.max(minDisplay, 80), to: Math.min(100, maxDisplay), color: '#f97316' },
    { from: Math.max(minDisplay, 100), to: maxDisplay, color: '#ef4444' },
  ].filter((z) => z.from < z.to)

  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      <svg viewBox="0 0 300 280" className="w-full max-w-[340px]" style={{ maxHeight: '300px' }}>
        {/* Background arc segments */}
        {zones.map((zone, i) => (
          <path
            key={i}
            d={describeArc(dbToAngle(zone.from), dbToAngle(zone.to), 120)}
            stroke={zone.color}
            strokeWidth={6}
            fill="none"
            opacity={0.25}
            strokeLinecap="round"
          />
        ))}

        {/* Active arc up to current db */}
        {isListening && db > -Infinity && (
          <path
            d={describeArc(dbToAngle(minDisplay), needleAngle, 120)}
            stroke={color}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        )}

        {/* Tick marks */}
        {ticks.map((tick, i) => {
          const outer = polarToCartesian(tick.angle, tick.major ? 132 : 128)
          const inner = polarToCartesian(tick.angle, tick.major ? 118 : 122)
          const label = tick.major ? polarToCartesian(tick.angle, 102) : null
          return (
            <g key={i}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={tick.major ? '#64748b' : '#334155'}
                strokeWidth={tick.major ? 2 : 1}
              />
              {label && (
                <text
                  x={label.x}
                  y={label.y + 3}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {tick.db}
                </text>
              )}
            </g>
          )
        })}

        {/* Peak marker */}
        {isListening && peak > -Infinity && (
          <g>
            {(() => {
              const pos = polarToCartesian(peakAngle, 120)
              return (
                <line
                  x1={pos.x}
                  y1={pos.y}
                  x2={pos.x}
                  y2={pos.y - 8}
                  stroke="#ef4444"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              )
            })()}
          </g>
        )}

        {/* Needle */}
        <g
          className="needle"
          style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: '150px 150px' }}
        >
          <line x1="150" y1="150" x2="150" y2="40" stroke={color} strokeWidth={3} strokeLinecap="round" />
          <circle cx="150" cy="150" r="8" fill={color} />
          <circle cx="150" cy="150" r="4" fill="#0a0e14" />
        </g>

        {/* Digital readout */}
        <text
          x="150"
          y="215"
          textAnchor="middle"
          fill={color}
          fontSize="42"
          fontFamily="ui-monospace, monospace"
          fontWeight="bold"
          className="tabular"
          style={{ filter: isListening && db > -Infinity ? `drop-shadow(0 0 8px ${color}60)` : 'none' }}
        >
          {displayDb}
        </text>
        <text x="150" y="240" textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="system-ui">
          dB({settings.weighting})
        </text>
      </svg>
    </div>
  )
}
