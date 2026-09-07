import type { SessionRecord, HistorySample, MeterSettings } from '../types'

/**
 * Convert session samples to CSV format.
 */
export function samplesToCsv(samples: HistorySample[], settings: MeterSettings): string {
  const header = [
    'timestamp_iso',
    'timestamp_ms',
    'level_db',
    'weighting',
    'response_time',
    'calibration_offset_db',
  ].join(',')

  const rows = samples.map((s) => {
    const iso = new Date(s.t).toISOString()
    return [iso, s.t, s.db.toFixed(1), settings.weighting, settings.responseTime, settings.calibrationOffset].join(
      ',',
    )
  })

  return [header, ...rows].join('\n')
}

/**
 * Convert session to JSON export format.
 */
export function sessionToJson(record: SessionRecord): string {
  return JSON.stringify(
    {
      ...record,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
    },
    null,
    2,
  )
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Format timestamp for filename.
 */
export function formatTimestampForFile(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}${pad(d.getSeconds())}`
}
