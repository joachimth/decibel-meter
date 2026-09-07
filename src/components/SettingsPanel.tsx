import type { MeterSettings, Weighting, ResponseTime } from '../types'

interface SettingsPanelProps {
  settings: MeterSettings
  onChange: (s: MeterSettings) => void
  onReset: () => void
  hasMicPermission: boolean
}

export function SettingsPanel({ settings, onChange, onReset }: SettingsPanelProps) {
  const update = <K extends keyof MeterSettings>(key: K, value: MeterSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-md mx-auto pb-4">
      {/* Weighting */}
      <div>
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Frequency Weighting</div>
        <div className="grid grid-cols-3 gap-2">
          {(['A', 'C', 'Z'] as Weighting[]).map((w) => (
            <button
              key={w}
              onClick={() => update('weighting', w)}
              className={`py-3 rounded-lg text-sm font-mono transition-colors ${
                settings.weighting === w
                  ? 'bg-meter-glow/20 text-meter-glow border border-meter-glow/40'
                  : 'bg-meter-surface text-slate-400 border border-meter-border'
              }`}
            >
              <div className="text-base font-bold">{w}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {w === 'A' ? 'Human ear' : w === 'C' ? 'Flat-ish' : 'Unweighted'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Response Time */}
      <div>
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Response Time</div>
        <div className="grid grid-cols-3 gap-2">
          {(['slow', 'fast', 'impulse'] as ResponseTime[]).map((rt) => (
            <button
              key={rt}
              onClick={() => update('responseTime', rt)}
              className={`py-3 rounded-lg text-sm font-mono transition-colors capitalize ${
                settings.responseTime === rt
                  ? 'bg-meter-glow/20 text-meter-glow border border-meter-glow/40'
                  : 'bg-meter-surface text-slate-400 border border-meter-border'
              }`}
            >
              <div className="text-base font-bold capitalize">{rt}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {rt === 'slow' ? '1s' : rt === 'fast' ? '125ms' : '35ms/1.5s'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calibration */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Calibration Offset</div>
          <div className="text-sm font-mono text-meter-glow">{settings.calibrationOffset > 0 ? '+' : ''}{settings.calibrationOffset.toFixed(1)} dB</div>
        </div>
        <input
          type="range"
          min="-20"
          max="20"
          step="0.5"
          value={settings.calibrationOffset}
          onChange={(e) => update('calibrationOffset', parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between mt-1 text-[9px] text-slate-600 font-mono">
          <span>-20 dB</span>
          <span>0 dB</span>
          <span>+20 dB</span>
        </div>
        <div className="text-[11px] text-slate-600 mt-2 leading-relaxed">
          Adjust to match a reference SPL meter. Use a calibrated sound source (e.g. 94 dB calibrator) for best accuracy.
        </div>
      </div>

      {/* Display Range */}
      <div>
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Gauge Range</div>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <div className="text-[9px] text-slate-500 font-mono mb-1">Min (dB)</div>
            <input
              type="number"
              value={settings.minDisplay}
              onChange={(e) => update('minDisplay', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-meter-surface border border-meter-border text-slate-200 font-mono text-sm focus:border-meter-glow/40 outline-none"
              min={0}
              max={settings.maxDisplay - 20}
            />
          </div>
          <div className="text-slate-600 mt-4">—</div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-500 font-mono mb-1">Max (dB)</div>
            <input
              type="number"
              value={settings.maxDisplay}
              onChange={(e) => update('maxDisplay', parseInt(e.target.value) || 120)}
              className="w-full px-3 py-2 rounded-lg bg-meter-surface border border-meter-border text-slate-200 font-mono text-sm focus:border-meter-glow/40 outline-none"
              min={settings.minDisplay + 20}
              max={160}
            />
          </div>
        </div>
      </div>

      {/* Spectrum Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Spectrum Dynamic Range</div>
          <div className="text-sm font-mono text-meter-glow">{settings.dynamicRange} dB</div>
        </div>
        <input
          type="range"
          min="40"
          max="120"
          step="5"
          value={settings.dynamicRange}
          onChange={(e) => update('dynamicRange', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between mt-1 text-[9px] text-slate-600 font-mono">
          <span>40 dB</span>
          <span>120 dB</span>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="py-3 rounded-lg bg-meter-surface border border-meter-border text-slate-400 text-sm font-mono hover:border-red-500/30 hover:text-red-400 transition-colors"
      >
        Reset all settings to defaults
      </button>

      {/* Info */}
      <div className="p-3 rounded-lg bg-meter-surface/50 border border-meter-border/50 text-[11px] text-slate-500 leading-relaxed">
        <div className="font-mono text-slate-400 mb-1">About accuracy</div>
        Phone microphone sensitivity varies by device. This app provides relative measurements suitable for comparing noise levels. For absolute SPL accuracy, calibrate against a certified sound level meter. The A-weighting filter follows IEC 61672-1.
      </div>
    </div>
  )
}
