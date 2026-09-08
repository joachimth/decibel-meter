import { useState, useCallback, useMemo } from 'react'
import { useAudioMeter } from './hooks/useAudioMeter'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { MeterSettings, Tab } from './types'
import { Gauge } from './components/Gauge'
import { Spectrum } from './components/Spectrum'
import { HistoryGraph } from './components/HistoryGraph'
import { StatsBar } from './components/StatsBar'
import { Dosimeter } from './components/Dosimeter'
import { SettingsPanel } from './components/SettingsPanel'
import { ReferenceLevels } from './components/ReferenceLevels'
import { TabBar } from './components/TabBar'
import { StartScreen } from './components/StartScreen'
import {
  samplesToCsv,
  sessionToJson,
  downloadFile,
  formatTimestampForFile,
} from './lib/export'

const DEFAULT_SETTINGS: MeterSettings = {
  weighting: 'A',
  responseTime: 'fast',
  calibrationOffset: 0,
  minDisplay: 20,
  maxDisplay: 120,
  dynamicRange: 80,
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function App() {
  const [tab, setTab] = useState<Tab>('meter')
  const [settings, setSettings] = useLocalStorage<MeterSettings>('dbmeter-settings', DEFAULT_SETTINGS)

  const meter = useAudioMeter(settings)
  const {
    isStarted,
    isListening,
    currentDb,
    stats,
    spectrumData,
    history,
    error,
    elapsedMs,
    start,
    stop,
    reset,
  } = meter

  const handleStart = useCallback(() => {
    void start()
  }, [start])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  const handleExportCsv = useCallback(() => {
    if (history.length === 0) return
    const csv = samplesToCsv(history, settings)
    downloadFile(csv, `decibel_${formatTimestampForFile(Date.now())}.csv`, 'text/csv')
  }, [history, settings])

  const handleExportJson = useCallback(() => {
    if (history.length === 0) return
    const record = {
      id: crypto.randomUUID(),
      name: `Session ${new Date().toLocaleString()}`,
      startTs: history[0]?.t ?? Date.now(),
      endTs: history[history.length - 1]?.t ?? Date.now(),
      samples: history,
      min: stats.min,
      max: stats.max,
      avg: stats.avg,
      peak: stats.peak,
      settings,
    }
    const json = sessionToJson(record)
    downloadFile(json, `decibel_${formatTimestampForFile(Date.now())}.json`, 'application/json')
  }, [history, stats, settings])

  const sampleRate = 48000 // default; actual comes from AudioContext but we use this for display

  const headerColor = useMemo(() => {
    const db = currentDb === -Infinity ? settings.minDisplay : currentDb
    if (db < 60) return '#22c55e'
    if (db < 80) return '#eab308'
    if (db < 100) return '#f97316'
    return '#ef4444'
  }, [currentDb, settings.minDisplay])

  if (!isStarted && !isListening) {
    return (
      <div className="min-h-[100dvh] bg-meter-bg">
        <StartScreen onStart={handleStart} error={error} />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-meter-bg flex flex-col">
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-meter-border sticky top-0 bg-meter-bg/95 backdrop-blur-md z-40"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isListening ? 'rec-pulse' : ''}`}
            style={{ backgroundColor: isListening ? headerColor : '#475569' }}
          />
          <span className="text-sm font-mono text-slate-300">
            {isListening ? 'REC' : 'STOPPED'}
          </span>
          <span className="text-xs font-mono text-slate-600 ml-1">{formatElapsed(elapsedMs)}</span>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 rounded-md bg-meter-surface border border-meter-border text-[11px] font-mono text-slate-400 hover:text-meter-glow hover:border-meter-glow/30 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={handleExportJson}
                className="px-2.5 py-1.5 rounded-md bg-meter-surface border border-meter-border text-[11px] font-mono text-slate-400 hover:text-meter-glow hover:border-meter-glow/30 transition-colors"
              >
                JSON
              </button>
            </>
          )}
          <button
            onClick={isListening ? handleStop : handleStart}
            className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-bold transition-colors ${
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-meter-glow/20 text-meter-glow border border-meter-glow/30'
            }`}
          >
            {isListening ? '■ STOP' : '▶ START'}
          </button>
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-md bg-meter-surface border border-meter-border text-[11px] font-mono text-slate-400 hover:text-amber-400 hover:border-amber-400/30 transition-colors"
          >
            ⟲
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 pb-20 no-scrollbar" style={{ paddingBottom: '80px' }}>
        {tab === 'meter' && (
          <div className="flex flex-col gap-3 fade-in">
            <Gauge db={currentDb} peak={stats.peak} settings={settings} isListening={isListening} />
            <StatsBar stats={stats} isListening={isListening} />
            <ReferenceLevels currentDb={currentDb} isListening={isListening} />
          </div>
        )}

        {tab === 'spectrum' && (
          <div className="flex flex-col fade-in h-[calc(100dvh-180px)]">
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
              Frequency Spectrum · {settings.weighting}-weighted
            </div>
            <div className="flex-1 min-h-0 rounded-xl bg-meter-surface/30 border border-meter-border p-2">
              <Spectrum
                data={spectrumData}
                sampleRate={sampleRate}
                dynamicRange={settings.dynamicRange}
                maxDisplay={settings.maxDisplay}
                isListening={isListening}
              />
            </div>
            <div className="text-[10px]  text-slate-600 mt-2 text-center font-mono">
              Logarithmic frequency scale · 48 bands · {settings.dynamicRange}dB dynamic range
            </div>
          </div>
        )}

        {tab === 'dosimeter' && (
          <div className="fade-in">
            <Dosimeter stats={stats} elapsedMs={elapsedMs} isListening={isListening} />
          </div>
        )}

        {tab === 'history' && (
          <div className="flex flex-col fade-in h-[calc(100dvh-180px)]">
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
              Level History · {formatElapsed(elapsedMs)}
            </div>
            <div className="flex-1 min-h-0 rounded-xl bg-meter-surface/30 border border-meter-border p-2">
              <HistoryGraph
                history={history}
                isListening={isListening}
                minDisplay={settings.minDisplay}
                maxDisplay={settings.maxDisplay}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-mono text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-red-500" /> Max
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-cyan-400" /> Avg/Level
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-green-500" /> Min
              </span>
            </div>
            {history.length > 0 && (
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-2 rounded-lg bg-meter-surface border border-meter-border text-xs font-mono text-slate-400 hover:text-meter-glow hover:border-meter-glow/30 transition-colors"
                >
                  ↓ Export CSV
                </button>
                <button
                  onClick={handleExportJson}
                  className="px-4 py-2 rounded-lg bg-meter-surface border border-meter-border text-xs font-mono text-slate-400 hover:text-meter-glow hover:border-meter-glow/30 transition-colors"
                >
                  ↓ Export JSON
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="fade-in">
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onReset={() => setSettings(DEFAULT_SETTINGS)}
              hasMicPermission={isStarted}
            />
          </div>
        )}
      </main>

      {/* Bottom tabs */}
      <TabBar active={tab} onChange={setTab} isListening={isListening} />
    </div>
  )
}
