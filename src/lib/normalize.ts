import type { Quote, Trade, InstrumentDefinition } from '../models'

export function normalizeQuote(raw: Quote): Quote {
  // For now the mock feed already matches the internal model.
  return raw
}

export function normalizeTrade(raw: Trade): Trade {
  return raw
}

export function normalizeInstrument(def: InstrumentDefinition): InstrumentDefinition {
  return def
}
