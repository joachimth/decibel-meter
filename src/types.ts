export type Weighting = 'A' | 'C' | 'Z'
export type ResponseTime = 'slow' | 'fast' | 'impulse'

export interface MeterSettings {
  weighting: Weighting
  responseTime: ResponseTime
  calibrationOffset: number // dB offset added to measured value
  minDisplay: number // min dB on gauge scale
  maxDisplay: number // max dB on gauge scale
  dynamicRange: number // spectrum dB range
}

export interface MeterStats {
  current: number
  min: number
  max: number
  avg: number
  peak: number
}

export interface HistorySample {
  t: number // timestamp ms
  db: number
}

export interface SessionRecord {
  id: string
  name: string
  startTs: number
  endTs: number
  samples: HistorySample[]
  min: number
  max: number
  avg: number
  peak: number
  settings: MeterSettings
}

export type Tab = 'meter' | 'spectrum' | 'dosimeter' | 'history' | 'settings'
