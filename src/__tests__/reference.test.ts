import { describe, it, expect } from 'vitest'
import { computeDose, computeTWA, OSHA_STANDARD, NIOSH_STANDARD, REFERENCE_LEVELS } from '../lib/reference'

describe('computeDose', () => {
  it('returns 100% for criterion level over 8 hours (NIOSH)', () => {
    const dose = computeDose(85, 8, NIOSH_STANDARD)
    expect(dose).toBeCloseTo(100, 0)
  })

  it('returns 100% for criterion level over 8 hours (OSHA)', () => {
    const dose = computeDose(90, 8, OSHA_STANDARD)
    expect(dose).toBeCloseTo(100, 0)
  })

  it('returns 0 for below threshold', () => {
    const dose = computeDose(70, 8, NIOSH_STANDARD)
    expect(dose).toBe(0)
  })

  it('doubles for 3dB exchange rate (NIOSH)', () => {
    const dose85 = computeDose(85, 8, NIOSH_STANDARD)
    const dose88 = computeDose(88, 8, NIOSH_STANDARD)
    expect(dose88).toBeCloseTo(dose85 * 2, 0)
  })

  it('increases dose with higher level', () => {
    const dose90 = computeDose(90, 4, NIOSH_STANDARD)
    const dose100 = computeDose(100, 4, NIOSH_STANDARD)
    expect(dose100).toBeGreaterThan(dose90)
  })
})

describe('computeTWA', () => {
  it('returns criterion for 8h at criterion level', () => {
    const twa = computeTWA(85, 8, NIOSH_STANDARD)
    expect(twa).toBeCloseTo(85, 0)
  })

  it('returns lower TWA for shorter exposure', () => {
    const twa8 = computeTWA(90, 8, NIOSH_STANDARD)
    const twa4 = computeTWA(90, 4, NIOSH_STANDARD)
    expect(twa4).toBeLessThan(twa8)
  })
})

describe('REFERENCE_LEVELS', () => {
  it('has entries from 0 to 140 dB', () => {
    expect(REFERENCE_LEVELS[0].db).toBe(0)
    expect(REFERENCE_LEVELS[REFERENCE_LEVELS.length - 1].db).toBe(140)
  })

  it('has color coding', () => {
    const quiet = REFERENCE_LEVELS.find((l) => l.db === 30)!
    const loud = REFERENCE_LEVELS.find((l) => l.db === 100)!
    expect(quiet.color).not.toBe(loud.color)
  })

  it('includes hearing damage threshold', () => {
    const threshold = REFERENCE_LEVELS.find((l) => l.db === 85)
    expect(threshold).toBeDefined()
    expect(threshold!.label).toContain('damage')
  })
})
