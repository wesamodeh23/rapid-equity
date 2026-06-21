export interface Instrument {
  id: string
  symbol: string
  displaySymbol: string
  type: 'equity' | 'futures' | 'option' | 'other'
}

export interface Quote {
  instrumentId: string
  bid: number
  ask: number
  last: number
  volume: number
  time: string
}

export interface Trade {
  instrumentId: string
  price: number
  size: number
  side: 'buy' | 'sell'
  time: string
}

export interface Bar {
  instrumentId: string
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface InstrumentDefinition {
  instrumentId: string
  symbol: string
  displaySymbol: string
  expiry?: string
  multiplier?: number
  ticksize?: number
}

export interface RiskCheckResult {
  ruleId: string
  ruleName: string
  severity: 'warning' | 'fail' | 'pass'
  passed: boolean
  explanation: string
  inputs?: Record<string, any>
  threshold?: any
}

export interface TradeIdea {
  id: string
  instrumentId: string
  direction: 'long' | 'short'
  entry: number
  stop: number
  size: number
  score: number
  approved?: boolean
  riskChecks?: RiskCheckResult[]
}

export interface Position {
  id: string
  instrumentId: string
  size: number
  avgPrice: number
  side: 'long' | 'short'
}

export interface FillRecord {
  id: string
  instrumentId: string
  qty: number
  price: number
  time: string
}

export interface JournalEntry {
  id: string
  setupTag?: string
  thesis?: string
  entryReason?: string
  exitReason?: string
  notes?: string
  timestamp: string
}
