interface StartScreenProps {
  onStart: () => void
  error: string | null
}

export function StartScreen({ onStart, error }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-6 fade-in">
      {/* Icon */}
      <div className="relative">
        <div className="flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-meter-glow/20 to-meter-glow/5 border border-meter-glow/30">
          <svg viewBox="0 0 64 64" className="w-14 h-14">
            <circle cx="32" cy="36" r="4" fill="#00e5ff" />
            <line x1="32" y1="36" x2="48" y2="14" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="36" r="20" stroke="#1e2530" strokeWidth="2" fill="none" />
            <path d="M 14 44 A 20 20 0 0 1 50 44" stroke="#22c55e" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
            <path d="M 18 48 A 20 20 0 0 0 46 48" stroke="#eab308" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M 22 50 A 20 20 0 0 0 42 50" stroke="#ef4444" strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-meter-glow/10 blur-xl -z-10" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100">Decibel Meter</h1>
        <p className="text-sm text-slate-500 mt-1">Professional sound level measurement</p>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {[
          { icon: '◉', text: 'Real-time SPL meter with A/C/Z weighting' },
          { icon: '∿', text: 'Frequency spectrum analyzer (20Hz - 20kHz)' },
          { icon: '%', text: 'Noise dosimeter (OSHA / NIOSH)' },
          { icon: '↓', text: 'Export measurement data as CSV / JSON' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-meter-surface/50 border border-meter-border/50">
            <span className="text-meter-glow text-base font-mono w-6 text-center">{f.icon}</span>
            <span className="text-[13px] text-slate-400">{f.text}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="w-full max-w-xs p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      <button
        onClick={onStart}
        className="px-12 py-4 rounded-2xl bg-meter-glow text-meter-bg text-base font-bold font-mono tracking-wide transition-all hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 0 30px rgba(0, 229, 255, 0.3)' }}
      >
        ▶ START MEASURING
      </button>

      <div className="text-[10px] text-slate-600 text-center max-w-xs leading-relaxed">
        Tap to grant microphone access. iOS requires HTTPS (this site is). Your audio never leaves your device.
      </div>
    </div>
  )
}
