import type { Quote, Trade, InstrumentDefinition, Bar } from '../../models'

export type QuoteHandler = (q: Quote) => void
export type TradeHandler = (t: Trade) => void

export interface DatabentoAdapter {
  connect(apiKey?: string): Promise<void>
  disconnect(): void
  subscribeQuotes(fn: QuoteHandler): () => void
  subscribeTrades(fn: TradeHandler): () => void
  testConnection(): Promise<{ ok: boolean; message?: string }>
  resolveInstrument(symbol: string): Promise<InstrumentDefinition>
  fetchHistoricalBars(symbol: string, start?: string, end?: string, interval?: string): Promise<Bar[]>
}
