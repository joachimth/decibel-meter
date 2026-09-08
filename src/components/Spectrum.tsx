import { useMemo } from 'react'

interface SpectrumProps {
  data: Float32Array | null
  sampleRate: number
  dynamicRange: number
  maxDisplay: number
  isListening: boolean
}

export function Spectrum({ data, sampleRate, dynamicRange, maxDisplay, isListening }: SpectrumProps) {
  const bins = useMemo(() => {
    if (!data) return []
    const binCount = data.length
    const nyquist = sampleRate / 2
    const freqPerBin = nyquist / binCount

    // We'll show logarithmic frequency scale from 20 Hz to 20 kHz
    // Group bins into ~48 logarithmic bands
    const numBands = 48
    const minFreq = 20
    const maxFreq = Math.min(20000, nyquist)

    const bands: { freq: number; db: number; label: string }[] = []
    for (let i = 0; i < numBands; i++) {
      const fLow = minFreq * Math.pow(maxFreq / minFreq, i / numBands)
      const fHigh = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / numBands)
      const binLow = Math.max(0, Math.floor(fLow / freqPerBin))
      const binHigh = Math.min(binCount - 1, Math.ceil(fHigh / freqPerBin))

      // Find peak in this band
      let peakDb = -Infinity
      for (let b = binLow; b <= binHigh && b < binCount; b++) {
        if (data[b] > peakDb) peakDb = data[b]
      }

      const centerFreq = Math.sqrt(fLow * fHigh)
      let label = ''
      if (centerFreq < 1000) {
        label = `${Math.round(centerFreq)}`
      } else {
        label = `${(centerFreq / 1000).toFixed(1)}k`
      }

      bands.push({ freq: centerFreq, db: peakDb, label })
    }
    return bands
  }, [data, sampleRate])

  // Spectrum data arrives in the SPL display domain (shifted per frame so its
  // summed power matches the SPL reading). Scale over dynamicRange below maxDisplay.
  const topDb = maxDisplay
  const bottomDb = maxDisplay - dynamicRange

  const dbToHeight = (db: number) => {
    const clamped = Math.max(bottomDb, Math.min(topDb, db))
    return ((clamped - bottomDb) / (topDb - bottomDb)) * 100
  }

  const dbToColor = (db: number) => {
    const pct = dbToHeight(db)
    if (pct < 30) return '#22c55e'
    if (pct < 60) return '#eab308'
    if (pct < 80) return '#f97316'
    return '#ef4444'
  }

  // Frequency labels at octave intervals
  const freqLabels = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  const labelPositions = freqLabels.map((f) => {
    const logMin = Math.log10(20)
    const logMax = Math.log10(Math.min(20000, sampleRate / 2))
    const pos = ((Math.log10(f) - logMin) / (logMax - logMin)) * 100
    return { freq: f, pos, label: f >= 1000 ? `${f / 1000}k` : `${f}` }
  })

  return (
    <div className="flex flex-col w-full h-full">
      {/* dB scale on left */}
      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col justify-between w-10 py-1 text-[9px] text-slate-500 font-mono text-right pr-1">
          <span>{maxDisplay}</span>
          <span>{Math.round(maxDisplay - dynamicRange * 0.25)}</span>
          <span>{Math.round(maxDisplay - dynamicRange * 0.5)}</span>
          <span>{Math.round(maxDisplay - dynamicRange * 0.75)}</span>
          <span>{maxDisplay - dynamicRange}</span>
        </div>
        <div className="relative flex-1 border-l border-slate-800">
          {bins.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              {isListening ? 'Analyzing...' : 'Start measurement to see spectrum'}
            </div>
          ) : (
            <div className="flex items-end gap-px h-full px-1">
              {bins.map((band, i) => (
                <div
                  key={i}
                  className="spec-bar flex-1 rounded-t-sm min-w-0"
                  style={{
                    height: `${dbToHeight(band.db)}%`,
                    backgroundColor: dbToColor(band.db),
                    opacity: isListening ? 0.85 : 0.3,
                    boxShadow: dbToHeight(band.db) > 80 ? `0 0 4px ${dbToColor(band.db)}80` : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Frequency labels */}
      <div className="relative h-5 ml-10 border-l border-slate-800">
        {labelPositions.map((lp, i) => (
          <div
            key={i}
            className="absolute text-[9px] text-slate-500 font-mono -translate-x-1/2"
            style={{ left: `${lp.pos}%`, top: 0 }}
          >
            {lp.label}
          </div>
        ))}
      </div>
    </div>
  )
}
