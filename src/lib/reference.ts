export interface ReferenceLevel {
  db: number
  label: string
  examples: string
  color: string
}

export const REFERENCE_LEVELS: ReferenceLevel[] = [
  { db: 0, label: 'Threshold of hearing', examples: 'Barely audible', color: '#22c55e' },
  { db: 10, label: 'Breathing', examples: 'Near-silent room', color: '#22c55e' },
  { db: 20, label: 'Whisper', examples: 'Whispering at 1m', color: '#22c55e' },
  { db: 30, label: 'Very quiet', examples: 'Quiet bedroom, library', color: '#22c55e' },
  { db: 40, label: 'Quiet', examples: 'Quiet office, bird calls', color: '#84cc16' },
  { db: 50, label: 'Moderate quiet', examples: 'Quiet suburb, light rain', color: '#84cc16' },
  { db: 60, label: 'Normal conversation', examples: 'Talking at 1m, dishwasher', color: '#eab308' },
  { db: 70, label: 'Loud', examples: 'Vacuum cleaner, busy office', color: '#eab308' },
  { db: 80, label: 'Very loud', examples: 'City traffic, alarm clock', color: '#f97316' },
  { db: 85, label: 'Hearing damage threshold', examples: '8hr exposure limit (OSHA)', color: '#f97316' },
  { db: 90, label: 'Very loud', examples: 'Lawn mower, motorcycle', color: '#f97316' },
  { db: 100, label: 'Extremely loud', examples: 'Jackhammer, subway train', color: '#ef4444' },
  { db: 110, label: 'Dangerous', examples: 'Rock concert, car horn', color: '#ef4444' },
  { db: 120, label: 'Pain threshold', examples: 'Thunderclap, jet takeoff at 100m', color: '#ef4444' },
  { db: 130, label: 'Pain', examples: 'Air raid siren', color: '#dc2626' },
  { db: 140, label: 'Instant hearing damage', examples: 'Gunshot, rocket launch', color: '#dc2626' },
]

/**
 * OSHA and NIOSH dose calculation standards.
 * OSHA: 90 dB threshold, 5 dB exchange rate
 * NIOSH: 85 dB threshold, 3 dB exchange rate
 */
export interface DoseStandard {
  name: string
  threshold: number // dB threshold
  exchangeRate: number // dB exchange rate
  criterion: number // dB level for 100% dose (typically 90 OSHA, 85 NIOSH)
  maxExposure: number // hours at criterion level
}

export const OSHA_STANDARD: DoseStandard = {
  name: 'OSHA',
  threshold: 80,
  exchangeRate: 5,
  criterion: 90,
  maxExposure: 8,
}

export const NIOSH_STANDARD: DoseStandard = {
  name: 'NIOSH',
  threshold: 80,
  exchangeRate: 3,
  criterion: 85,
  maxExposure: 8,
}

export const DOSE_STANDARDS = [OSHA_STANDARD, NIOSH_STANDARD]

/**
 * Compute noise dose percentage.
 * Dose = 100 * (T_actual / T_allowed) where T_allowed = maxExposure / 2^((L - criterion) / exchangeRate)
 */
export function computeDose(
  avgDb: number,
  durationHours: number,
  standard: DoseStandard,
): number {
  if (avgDb < standard.threshold) return 0
  const tAllowed =
    standard.maxExposure /
    Math.pow(2, (avgDb - standard.criterion) / standard.exchangeRate)
  return (100 * durationHours) / tAllowed
}

/**
 * Compute Time-Weighted Average (TWA) for a given dose and duration.
 */
export function computeTWA(
  avgDb: number,
  durationHours: number,
  standard: DoseStandard,
): number {
  if (durationHours <= 0) return 0
  // TWA = criterion + exchangeRate * log2(8 / T_allowed_at_avg)
  // Simplified: TWA is the equivalent 8-hour level
  const tAllowed =
    standard.maxExposure /
    Math.pow(2, (avgDb - standard.criterion) / standard.exchangeRate)
  const doseFraction = durationHours / tAllowed
  // TWA for 8 hours:
  return standard.criterion + standard.exchangeRate * Math.log2(doseFraction * (8 / standard.maxExposure))
}
