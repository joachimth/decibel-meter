import { describe, it, expect } from 'vitest'
import {
  rmsToDb,
  bufferRmsToDb,
  aWeightDb,
  cWeightDb,
  zWeightDb,
  getWeightingFunc,
  weightingCorrectionFromFft,
  TimeWeighting,
  PeakDetector,
} from '../lib/db'
import type { Weighting } from '../types'

describe('rmsToDb', () => {
  it('converts RMS amplitude to dB SPL', () => {
    expect(rmsToDb(1.0, 100)).toBe(100)
    expect(rmsToDb(0.1, 100)).toBeCloseTo(80, 0)
    expect(rmsToDb(0.01, 100)).toBeCloseTo(60, 0)
    expect(rmsToDb(0.001, 100)).toBeCloseTo(40, 0)
  })

  it('returns -Infinity for zero or negative RMS', () => {
    expect(rmsToDb(0)).toBe(-Infinity)
    expect(rmsToDb(-1)).toBe(-Infinity)
  })
})

describe('bufferRmsToDb', () => {
  it('computes dB from a buffer of samples', () => {
    const buf = new Float32Array(1024).fill(0.1)
    const db = bufferRmsToDb(buf, 100)
    expect(db).toBeCloseTo(80, 0)
  })

  it('returns -Infinity for silent buffer', () => {
    const buf = new Float32Array(1024).fill(0)
    expect(bufferRmsToDb(buf)).toBe(-Infinity)
  })
})

describe('aWeightDb', () => {
  it('is approximately 0 dB at 1000 Hz (reference)', () => {
    expect(aWeightDb(1000)).toBeCloseTo(0, 1)
  })

  it('is approximately -19 dB at 100 Hz', () => {
    // Standard A-weighting at 100 Hz is about -19.1 dB
    expect(aWeightDb(100)).toBeCloseTo(-19.1, 0)
  })

  it('is approximately -2.5 dB at 10000 Hz', () => {
    expect(aWeightDb(10000)).toBeCloseTo(-2.5, 0)
  })

  it('is positive around 2-3 kHz (ear sensitivity peak)', () => {
    expect(aWeightDb(2500)).toBeGreaterThan(0)
  })

  it('heavily attenuates very low frequencies', () => {
    expect(aWeightDb(20)).toBeLessThan(-30)
    expect(aWeightDb(10)).toBeLessThan(-70)
  })

  it('attenuates very high frequencies', () => {
    expect(aWeightDb(20000)).toBeLessThan(-9)
  })

  it('returns -1000 for zero frequency', () => {
    expect(aWeightDb(0)).toBe(-1000)
  })
})

describe('cWeightDb', () => {
  it('is approximately 0 dB at 1000 Hz', () => {
    expect(cWeightDb(1000)).toBeCloseTo(0, 1)
  })

  it('is flatter than A-weighting at low frequencies', () => {
    // C-weighting at 100 Hz is about -0.2 dB (vs -19 for A)
    expect(cWeightDb(100)).toBeGreaterThan(-1)
  })

  it('attenuates very low frequencies less than A-weighting', () => {
    expect(cWeightDb(20)).toBeGreaterThan(aWeightDb(20))
  })
})

describe('zWeightDb', () => {
  it('returns 0 for all frequencies', () => {
    expect(zWeightDb(20)).toBe(0)
    expect(zWeightDb(1000)).toBe(0)
    expect(zWeightDb(20000)).toBe(0)
  })
})

describe('getWeightingFunc', () => {
  it('returns the correct function for each weighting type', () => {
    expect(getWeightingFunc('A')(1000)).toBeCloseTo(0, 1)
    expect(getWeightingFunc('C')(1000)).toBeCloseTo(0, 1)
    expect(getWeightingFunc('Z')(1000)).toBe(0)
  })

  it('A-weighting function attenuates low frequencies', () => {
    const fn = getWeightingFunc('A' as Weighting)
    expect(fn(100)).toBeLessThan(fn(1000))
  })
})

describe('weightingCorrectionFromFft', () => {
  it('returns 0 for all-silent data', () => {
    const data = new Float32Array(1024).fill(-Infinity)
    expect(weightingCorrectionFromFft(data, 48000, 2048, 'A')).toBe(0)
  })

  it('returns 0 for Z-weighting regardless of data', () => {
    const data = new Float32Array(1024).fill(-20)
    expect(weightingCorrectionFromFft(data, 48000, 2048, 'Z')).toBe(0)
  })

  it('returns a negative correction for A-weighting with broadband signal', () => {
    // A-weighting attenuates low and high frequencies, so the correction
    // for broadband noise should be negative (less energy after weighting)
    const data = new Float32Array(1024).fill(-20)
    const result = weightingCorrectionFromFft(data, 48000, 2048, 'A')
    expect(result).toBeLessThan(0)
  })

  it('A-weighting correction is more negative for low-frequency content than mid', () => {
    // Low-frequency only
    const lowData = new Float32Array(1024).fill(-Infinity)
    for (let i = 0; i < 10; i++) lowData[i] = -10
    const lowCorr = weightingCorrectionFromFft(lowData, 48000, 2048, 'A')

    // Mid-frequency only (around 1kHz)
    const midData = new Float32Array(1024).fill(-Infinity)
    const bin1k = Math.round(1000 / (48000 / 2048))
    for (let i = bin1k - 5; i <= bin1k + 5; i++) {
      if (i >= 0 && i < midData.length) midData[i] = -10
    }
    const midCorr = weightingCorrectionFromFft(midData, 48000, 2048, 'A')

    expect(lowCorr).toBeLessThan(midCorr)
  })
})

describe('TimeWeighting', () => {
  it('responds to changes in level', () => {
    const tw = new TimeWeighting('fast', 48000)
    const result1 = tw.process(60)
    expect(result1).toBeCloseTo(60, 0)

    // Should track upward
    let result = result1
    for (let i = 0; i < 1000; i++) {
      result = tw.process(80)
    }
    expect(result).toBeGreaterThan(70)
  })

  it('returns -Infinity initially when fed silence', () => {
    const tw = new TimeWeighting('slow', 48000)
    const result = tw.process(-Infinity)
    expect(result).toBe(-Infinity)
  })

  it('resets', () => {
    const tw = new TimeWeighting('fast', 48000)
    tw.process(80)
    tw.reset()
    const result = tw.process(-Infinity)
    expect(result).toBe(-Infinity)
  })
})

describe('PeakDetector', () => {
  it('tracks the maximum', () => {
    const pd = new PeakDetector(1000)
    pd.process(50, 0)
    pd.process(80, 10)
    pd.process(60, 20)
    expect(pd.value).toBe(80)
  })

  it('resets', () => {
    const pd = new PeakDetector(1000)
    pd.process(80, 0)
    pd.reset()
    expect(pd.value).toBe(-Infinity)
  })

  it('holds the peak value', () => {
    const pd = new PeakDetector(1000)
    pd.process(90, 0)
    pd.process(50, 100)
    expect(pd.value).toBe(90) // still 90
  })
})
