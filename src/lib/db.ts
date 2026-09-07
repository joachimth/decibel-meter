import type { Weighting, ResponseTime } from '../types'

/**
 * Frequency weighting functions for SPL measurement.
 * A-weighting approximates human hearing response (IEC 61672-1).
 * C-weighting is flatter, used for high SPL.
 * Z-weighting is unweighted (flat).
 *
 * Implementation: pure frequency-domain correction applied to FFT bins.
 * This is more accurate than biquad cascades and avoids coefficient tuning.
 */

/**
 * A-weighting relative response in dB at a given frequency.
 * Based on the IEC 61672-1 transfer function:
 *   Ra(f) = (12194.22^2 * f^4) / ((f^2 + 20.598997^2) * sqrt((f^2 + 107.65265^2)*(f^2 + 737.86223^2)) * (f^2 + 12194.22^2))
 *   A(f) = 20*log10(Ra(f)) + 2.00 dB (normalization)
 */
export function aWeightDb(freq: number): number {
  if (freq <= 0) return -1000
  const f2 = freq * freq
  const num = 12194.22 * 12194.22 * f2 * f2
  const den =
    (f2 + 20.598997 * 20.598997) *
    Math.sqrt((f2 + 107.65265 * 107.65265) * (f2 + 737.86223 * 737.86223)) *
    (f2 + 12194.22 * 12194.22)
  const ra = num / den
  if (ra <= 0) return -1000
  return 20 * Math.log10(ra) + 2.0
}

/**
 * C-weighting relative response in dB at a given frequency.
 *   Rc(f) = (12194.22^2 * f^2) / ((f^2 + 20.598997^2) * (f^2 + 12194.22^2))
 *   C(f) = 20*log10(Rc(f)) + 0.06 dB (normalization)
 */
export function cWeightDb(freq: number): number {
  if (freq <= 0) return -1000
  const f2 = freq * freq
  const num = 12194.22 * 12194.22 * f2
  const den = (f2 + 20.598997 * 20.598997) * (f2 + 12194.22 * 12194.22)
  const rc = num / den
  if (rc <= 0) return -1000
  return 20 * Math.log10(rc) + 0.0619
}

/**
 * Z-weighting (flat, 0 dB at all frequencies).
 */
export function zWeightDb(_freq: number): number {
  return 0
}

/**
 * Get the weighting correction function for a given weighting type.
 */
export function getWeightingFunc(weighting: Weighting): (freq: number) => number {
  switch (weighting) {
    case 'A':
      return aWeightDb
    case 'C':
      return cWeightDb
    case 'Z':
    default:
      return zWeightDb
  }
}

/**
 * Compute SPL (Sound Pressure Level) in dB from RMS amplitude.
 * @param rms - RMS amplitude (0..1 range for full-scale audio)
 * @param dbFullScale - reference dB for full-scale (typically 94 dB SPL for 1 Pa)
 * @returns dB SPL value
 */
export function rmsToDb(rms: number, dbFullScale = 94): number {
  if (rms <= 0) return -Infinity
  return dbFullScale + 20 * Math.log10(rms)
}

/**
 * Compute dB from a time-domain buffer (Z-weighted / unweighted).
 */
export function bufferRmsToDb(buf: Float32Array, dbFullScale = 94): number {
  let sum = 0
  for (let i = 0; i < buf.length; i++) {
    sum += buf[i] * buf[i]
  }
  const rms = Math.sqrt(sum / buf.length)
  return rmsToDb(rms, dbFullScale)
}

/**
 * Compute weighted SPL from FFT magnitude data.
 * @param floatFreqData - Output of AnalyserNode.getFloatFrequencyData() (dBFS values)
 * @param sampleRate - AudioContext sample rate
 * @param fftSize - AnalyserNode FFT size
 * @param weighting - Weighting type
 * @param dbFullScale - Reference dB for full-scale
 * @returns Weighted dB SPL
 */
export function weightedSplFromFft(
  floatFreqData: Float32Array,
  sampleRate: number,
  fftSize: number,
  weighting: Weighting,
  dbFullScale = 94,
): number {
  const weightFunc = getWeightingFunc(weighting)
  const binCount = floatFreqData.length
  const freqPerBin = sampleRate / fftSize

  let powerSum = 0
  let validBins = 0

  for (let i = 0; i < binCount; i++) {
    const freq = i * freqPerBin
    const dbFs = floatFreqData[i]
    if (dbFs === -Infinity || isNaN(dbFs)) continue

    // Convert dBFS to linear magnitude
    const mag = Math.pow(10, dbFs / 20)
    // Apply frequency weighting correction
    const weightDb = weightFunc(freq)
    const weightLin = Math.pow(10, weightDb / 20)
    const weightedMag = mag * weightLin
    powerSum += weightedMag * weightedMag
    validBins++
  }

  if (validBins === 0 || powerSum <= 0) return -Infinity
  const rms = Math.sqrt(powerSum / validBins)
  return rmsToDb(rms, dbFullScale)
}

/**
 * Response time constants.
 * Slow: 1s time constant
 * Fast: 0.125s time constant
 * Impulse: 35ms rise, 1.5s decay
 */
const TIME_CONSTANTS: Record<ResponseTime, { attack: number; release: number }> = {
  slow: { attack: 1.0, release: 1.0 },
  fast: { attack: 0.125, release: 0.125 },
  impulse: { attack: 0.035, release: 1.5 },
}

/**
 * Exponential time-weighting for dB level (IEC 61672-1).
 * Works in the linear (energy) domain for proper averaging.
 */
export class TimeWeighting {
  private levelLin = 0
  private hasData = false
  private attackTau: number
  private releaseTau: number

  constructor(responseTime: ResponseTime, private fs: number) {
    const tc = TIME_CONSTANTS[responseTime]
    this.attackTau = tc.attack
    this.releaseTau = tc.release
  }

  reset() {
    this.levelLin = 0
    this.hasData = false
  }

  process(instantDb: number): number {
    if (instantDb === -Infinity || isNaN(instantDb)) {
      return this.hasData ? 10 * Math.log10(Math.max(this.levelLin, 1e-12)) : -Infinity
    }

    const dt = 1 / this.fs
    const linInst = Math.pow(10, instantDb / 10)

    if (!this.hasData) {
      this.levelLin = linInst
      this.hasData = true
      return instantDb
    }

    const tau = instantDb > 10 * Math.log10(Math.max(this.levelLin, 1e-12)) ? this.attackTau : this.releaseTau
    const alpha = 1 - Math.exp(-dt / tau)
    this.levelLin = this.levelLin + alpha * (linInst - this.levelLin)
    return 10 * Math.log10(Math.max(this.levelLin, 1e-12))
  }
}

/**
 * Peak detector with hold.
 */
export class PeakDetector {
  private peak = -Infinity

  constructor(_holdMs = 1000) {}

  reset() {
    this.peak = -Infinity
  }

  process(db: number, _timestampMs: number): number {
    if (db > this.peak) {
      this.peak = db
    }
    return this.peak
  }

  get value(): number {
    return this.peak
  }
}
