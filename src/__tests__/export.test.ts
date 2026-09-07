import { describe, it, expect } from 'vitest'
import { samplesToCsv, sessionToJson, formatTimestampForFile } from '../lib/export'
import type { HistorySample, SessionRecord, MeterSettings } from '../types'

const settings: MeterSettings = {
  weighting: 'A',
  responseTime: 'fast',
  calibrationOffset: 0,
  minDisplay: 20,
  maxDisplay: 120,
  dynamicRange: 80,
}

describe('samplesToCsv', () => {
  it('generates CSV with header and data rows', () => {
    const samples: HistorySample[] = [
      { t: 1700000000000, db: 45.2 },
      { t: 1700000000250, db: 47.8 },
    ]
    const csv = samplesToCsv(samples, settings)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('timestamp_iso')
    expect(lines[0]).toContain('level_db')
    expect(lines[0]).toContain('weighting')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain('45.2')
    expect(lines[1]).toContain('A')
  })
})

describe('sessionToJson', () => {
  it('produces valid JSON with metadata', () => {
    const record: SessionRecord = {
      id: 'test-1',
      name: 'Test Session',
      startTs: 1700000000000,
      endTs: 1700000001000,
      samples: [{ t: 1700000000000, db: 50 }],
      min: 40,
      max: 60,
      avg: 50,
      peak: 65,
      settings,
    }
    const json = sessionToJson(record)
    const parsed = JSON.parse(json)
    expect(parsed.id).toBe('test-1')
    expect(parsed.appVersion).toBe('1.0.0')
    expect(parsed.exportedAt).toBeDefined()
    expect(parsed.samples).toHaveLength(1)
  })
})

describe('formatTimestampForFile', () => {
  it('formats timestamp as YYYYMMDD_HHMMSS', () => {
    const ts = new Date(2026, 0, 15, 14, 30, 45).getTime()
    const formatted = formatTimestampForFile(ts)
    expect(formatted).toBe('20260115_143045')
  })
})
