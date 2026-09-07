import { useRef, useState, useCallback, useEffect } from 'react'
import type { MeterSettings, MeterStats, HistorySample } from '../types'
import {
  weightedSplFromFft,
  TimeWeighting,
  PeakDetector,
} from '../lib/db'

const HISTORY_INTERVAL_MS = 250 // sample history every 250ms
const MAX_HISTORY_SAMPLES = 14400 // ~1 hour at 250ms interval

export interface AudioMeterState {
  isStarted: boolean
  isListening: boolean
  currentDb: number
  stats: MeterStats
  spectrumData: Float32Array | null
  history: HistorySample[]
  error: string | null
  elapsedMs: number
}

export function useAudioMeter(settings: MeterSettings) {
  const [isStarted, setIsStarted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentDb, setCurrentDb] = useState(-Infinity)
  const [stats, setStats] = useState<MeterStats>({
    current: -Infinity,
    min: Infinity,
    max: -Infinity,
    avg: -Infinity,
    peak: -Infinity,
  })
  const [spectrumData, setSpectrumData] = useState<Float32Array | null>(null)
  const [history, setHistory] = useState<HistorySample[]>([])
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const freqDataRef = useRef<Float32Array>(new Float32Array(1024))
  const timeWeightingRef = useRef<TimeWeighting | null>(null)
  const peakDetectorRef = useRef<PeakDetector | null>(null)
  const startTsRef = useRef<number>(0)
  const lastHistorySampleRef = useRef<number>(0)
  const sumLinearRef = useRef<number>(0)
  const sampleCountRef = useRef<number>(0)
  const minRef = useRef<number>(Infinity)
  const maxRef = useRef<number>(-Infinity)
  const peakRef = useRef<number>(-Infinity)
  const settingsRef = useRef(settings)
  const runningRef = useRef(false)

  // Keep settings ref updated
  useEffect(() => {
    settingsRef.current = settings
    // Update time weighting if running
    if (audioContextRef.current && runningRef.current) {
      timeWeightingRef.current = new TimeWeighting(
        settings.responseTime,
        audioContextRef.current.sampleRate,
      )
    }
  }, [settings])

  const processFrame = useCallback(() => {
    if (!runningRef.current || !analyserRef.current) return

    const analyser = analyserRef.current
    const fqBuf = freqDataRef.current

    // Get frequency data first (needed for weighted SPL)
    analyser.getFloatFrequencyData(fqBuf as Float32Array<ArrayBuffer>)

    // Compute weighted SPL from FFT
    const fs = audioContextRef.current?.sampleRate ?? 48000
    const instantDb = weightedSplFromFft(
      fqBuf as Float32Array<ArrayBuffer>,
      fs,
      analyser.fftSize,
      settingsRef.current.weighting,
    ) + settingsRef.current.calibrationOffset

    // Apply time weighting
    const tw = timeWeightingRef.current
    const weightedDb = tw ? tw.process(instantDb) : instantDb

    // Peak detection
    const pd = peakDetectorRef.current
    const now = performance.now()
    const realNow = Date.now()
    if (pd) {
      const p = pd.process(weightedDb, now)
      if (p > peakRef.current) peakRef.current = p
    }

    // Track min/max/sum
    if (weightedDb > -Infinity && !isNaN(weightedDb)) {
      if (weightedDb < minRef.current) minRef.current = weightedDb
      if (weightedDb > maxRef.current) maxRef.current = weightedDb
      sumLinearRef.current += Math.pow(10, weightedDb / 10)
      sampleCountRef.current++
    }

    // Update state
    setCurrentDb(weightedDb)
    setSpectrumData(new Float32Array(fqBuf))

    const elapsed = realNow - startTsRef.current
    setElapsedMs(elapsed)

    // Compute running stats
    const avg =
      sampleCountRef.current > 0
        ? 10 * Math.log10(sumLinearRef.current / sampleCountRef.current)
        : -Infinity

    setStats({
      current: weightedDb,
      min: minRef.current === Infinity ? -Infinity : minRef.current,
      max: maxRef.current,
      avg,
      peak: peakRef.current,
    })

    // History sampling
    if (realNow - lastHistorySampleRef.current >= HISTORY_INTERVAL_MS) {
      lastHistorySampleRef.current = realNow
      const sample: HistorySample = { t: realNow, db: weightedDb }
      setHistory((prev) => {
        const next = [...prev, sample]
        if (next.length > MAX_HISTORY_SAMPLES) {
          return next.slice(next.length - MAX_HISTORY_SAMPLES)
        }
        return next
      })
    }

    rafRef.current = requestAnimationFrame(processFrame)
  }, [])

  const start = useCallback(async () => {
    if (runningRef.current) return
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      // Resume context (needed for iOS)
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.5
      analyserRef.current = analyser

      source.connect(analyser)

      // Initialize processors
      const fs = ctx.sampleRate
      timeWeightingRef.current = new TimeWeighting(settingsRef.current.responseTime, fs)
      peakDetectorRef.current = new PeakDetector(1000)

      // Reset stats
      minRef.current = Infinity
      maxRef.current = -Infinity
      peakRef.current = -Infinity
      sumLinearRef.current = 0
      sampleCountRef.current = 0
      startTsRef.current = Date.now()
      lastHistorySampleRef.current = Date.now()

      setHistory([])
      setIsStarted(true)
      setIsListening(true)
      runningRef.current = true

      rafRef.current = requestAnimationFrame(processFrame)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to access microphone'
      setError(msg)
      setIsStarted(false)
      setIsListening(false)
    }
  }, [processFrame])

  const stop = useCallback(() => {
    runningRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setIsListening(false)
    setIsStarted(false)
  }, [])

  const reset = useCallback(() => {
    minRef.current = Infinity
    maxRef.current = -Infinity
    peakRef.current = -Infinity
    sumLinearRef.current = 0
    sampleCountRef.current = 0
    startTsRef.current = Date.now()
    lastHistorySampleRef.current = Date.now()
    setHistory([])
    if (timeWeightingRef.current) timeWeightingRef.current.reset()
    if (peakDetectorRef.current) peakDetectorRef.current.reset()
  }, [])

  useEffect(() => {
    return () => {
      if (runningRef.current) {
        runningRef.current = false
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {})
        }
      }
    }
  }, [])

  return {
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
  }
}
