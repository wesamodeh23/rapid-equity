import type { DatabentoAdapter, QuoteHandler, TradeHandler } from './DatabentoAdapter'
import type { Quote, Trade, InstrumentDefinition } from '../../models'

function nowIso() { return new Date().toISOString() }

const SAMPLE_SYMBOLS = ['AAPL', 'MSFT', 'ESZ3', 'CLZ3']

export default class MockDatabentoAdapter implements DatabentoAdapter {
  private quoteSubs: QuoteHandler[] = []
  private tradeSubs: TradeHandler[] = []
  private interval?: number
  private connected = false

  async connect() {
    this.connected = true
    // start emitting mock quotes
    this.interval = window.setInterval(() => this.emitTick(), 800)
  }

  disconnect() {
    this.connected = false
    if (this.interval) window.clearInterval(this.interval)
  }

  subscribeQuotes(fn: QuoteHandler) {
    this.quoteSubs.push(fn)
    return () => { this.quoteSubs = this.quoteSubs.filter(s => s !== fn) }
  }

  subscribeTrades(fn: TradeHandler) {
    this.tradeSubs.push(fn)
    return () => { this.tradeSubs = this.tradeSubs.filter(s => s !== fn) }
  }

  async testConnection() {
    return { ok: true, message: 'Mock adapter connected' }
  }

  async resolveInstrument(symbol: string): Promise<InstrumentDefinition> {
    return {
      instrumentId: symbol.toUpperCase() + ':ID',
      symbol: symbol.toUpperCase(),
      displaySymbol: symbol.toUpperCase(),
      expiry: undefined,
      multiplier: 1,
      ticksize: 0.01
    }
  }

  async fetchHistoricalBars(symbol: string, start?: string, end?: string, interval?: string) {
    // generate simple mock bars by walking forward in seconds
    const bars: any[] = []
    const now = start ? new Date(start).getTime() : Date.now()
    for (let i = 0; i < 120; i++) {
      const t = new Date(now + i * 1000).toISOString()
      const base = 100 + Math.sin(i / 10) * 2 + Math.random()
      bars.push({ instrumentId: symbol.toUpperCase() + ':ID', t, o: +(base - 0.5).toFixed(2), h: +(base + 0.5).toFixed(2), l: +(base - 1).toFixed(2), c: +base.toFixed(2), v: Math.round(Math.random() * 1000) })
    }
    return bars
  }

  private emitTick() {
    for (const s of SAMPLE_SYMBOLS) {
      const mid = 100 + Math.random() * 50
      const spread = Math.max(0.01, Math.random() * 0.2)
      const q: Quote = {
        instrumentId: s + ':ID',
        bid: +(mid - spread/2).toFixed(2),
        ask: +(mid + spread/2).toFixed(2),
        last: +mid.toFixed(2),
        volume: Math.round(Math.random() * 1000),
        time: nowIso()
      }
      this.quoteSubs.forEach(fn => fn(q))

      if (Math.random() > 0.7) {
        const t: Trade = {
          instrumentId: s + ':ID',
          price: q.last,
          size: Math.round(Math.random() * 50) + 1,
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          time: nowIso()
        }
        this.tradeSubs.forEach(fn => fn(t))
      }
    }
  }
}
