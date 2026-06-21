import type { DatabentoAdapter, QuoteHandler, TradeHandler } from './DatabentoAdapter'
import type { Quote, Trade, InstrumentDefinition } from '../../models'
import Logger from '../../lib/logger'

// RealDatabentoAdapter is a scaffold to integrate Databento's live/historical APIs.
// It intentionally avoids hardcoding endpoints; replace the TODOs with real API calls
// according to your Databento plan and client library.
export default class RealDatabentoAdapter implements DatabentoAdapter {
  private apiKey?: string
  private dataset?: string
  private connected = false
  private pollHandle?: number
  private ws?: WebSocket
  private quoteHandlers: QuoteHandler[] = []
  private tradeHandlers: TradeHandler[] = []
  private reconnectAttempts = 0
  private shouldReconnect = true

  constructor(apiKey?: string, dataset?: string) {
    this.apiKey = apiKey
    this.dataset = dataset
  }

  async connect(apiKey?: string) {
    if (apiKey) this.apiKey = apiKey
    if (!this.apiKey) throw new Error('Databento API key required')
    // Lightweight connect: validate API key by calling symbology.resolve (best-effort)
    try {
      const res = await this.testConnection()
      if (!res.ok) throw new Error(res.message || 'Databento connection test failed')
      this.connected = true
      Logger.info('RealDatabentoAdapter', 'connected')
    } catch (err:any) {
      Logger.warn('RealDatabentoAdapter', 'connect validation failed', err?.message || err)
      // still mark as connected; subscriptions may fail later
      this.connected = true
    }
  }

  disconnect() {
    this.connected = false
    if (this.pollHandle) window.clearInterval(this.pollHandle)
    try {
      this.shouldReconnect = false
      this.ws?.close()
    } catch (err) {}
    Logger.info('RealDatabentoAdapter', 'disconnected')
  }

  subscribeQuotes(fn: QuoteHandler) {
    this.quoteHandlers.push(fn)
    this.ensureWsConnected()
    return () => {
      this.quoteHandlers = this.quoteHandlers.filter(h => h !== fn)
      // if no handlers left, close ws to conserve resources
      if (this.quoteHandlers.length === 0 && this.tradeHandlers.length === 0) {
        try { this.ws?.close() } catch (err) {}
      }
    }
  }

  subscribeTrades(fn: TradeHandler) {
    this.tradeHandlers.push(fn)
    this.ensureWsConnected()
    return () => {
      this.tradeHandlers = this.tradeHandlers.filter(h => h !== fn)
      if (this.quoteHandlers.length === 0 && this.tradeHandlers.length === 0) {
        try { this.ws?.close() } catch (err) {}
      }
    }
  }

  private ensureWsConnected() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return
    if (!this.apiKey) return
    const dataset = this.dataset ?? ''
    // Best-effort websocket endpoint for Databento; adjust per provider docs.
    const url = `wss://stream.databento.com/v1/stream?dataset=${encodeURIComponent(dataset)}&token=${encodeURIComponent(this.apiKey)}`
    try {
      this.shouldReconnect = true
      this.ws = new WebSocket(url)
      this.ws.onopen = () => {
        Logger.info('RealDatabentoAdapter', 'ws open')
        this.reconnectAttempts = 0
      }
      this.ws.onmessage = (ev) => this.handleWsMessage(ev.data)
      this.ws.onclose = (ev) => {
        Logger.warn('RealDatabentoAdapter', 'ws closed', ev.reason)
        if (this.shouldReconnect) this.scheduleReconnect()
      }
      this.ws.onerror = (ev) => {
        Logger.warn('RealDatabentoAdapter', 'ws error', String(ev))
      }
    } catch (err:any) {
      Logger.warn('RealDatabentoAdapter', 'ws connect failed', err?.message ?? String(err))
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts = Math.min(10, this.reconnectAttempts + 1)
    const delay = Math.min(30000, 500 * (2 ** this.reconnectAttempts))
    setTimeout(() => { if (this.shouldReconnect) this.ensureWsConnected() }, delay)
  }

  private handleWsMessage(raw: any) {
    try {
      const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
      // defensive mapping: support {type: 'quote', data: {...}} or raw tick objects
      if (msg?.type === 'quote' && msg.data) {
        const d = msg.data
        const q: Quote = { instrumentId: d.instrument_id ?? d.instrumentId ?? d.symbol, bid: d.bid ?? d.b ?? 0, ask: d.ask ?? d.a ?? 0, last: d.last ?? d.p ?? 0, volume: d.v ?? d.volume ?? 0, time: d.t ?? d.time ?? new Date().toISOString() }
        this.quoteHandlers.forEach(h => { try { h(q) } catch (e) {} })
        return
      }
      if (msg?.type === 'trade' && msg.data) {
        const d = msg.data
        const t: Trade = { instrumentId: d.instrument_id ?? d.instrumentId ?? d.symbol, price: d.price ?? d.p ?? 0, size: d.size ?? d.s ?? 0, side: (d.side === 'sell' || d.side === 'ask') ? 'sell' : 'buy', time: d.t ?? d.time ?? new Date().toISOString() }
        this.tradeHandlers.forEach(h => { try { h(t) } catch (e) {} })
        return
      }
      // sometimes providers send arrays of events
      if (Array.isArray(msg)) {
        msg.forEach((item) => this.handleWsMessage(JSON.stringify(item)))
      }
    } catch (err:any) {
      // ignore parse errors
    }
  }

  async testConnection() {
    if (!this.apiKey) return { ok: false, message: 'API key missing' }
    try {
      // Attempt a basic symbology resolve; endpoint may vary by Databento version.
      const url = 'https://api.databento.com/v1/symbology/resolve'
      const body = { input: 'AAPL', input_type: 'raw_symbol', output_type: 'instrument_id' }
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify(body)
      })
      if (!resp.ok) {
        const txt = await resp.text()
        return { ok: false, message: `Databento respond ${resp.status} ${txt}` }
      }
      // Attempt to parse response to ensure API key is valid
      await resp.json()
      return { ok: true, message: 'Databento key validated' }
    } catch (err: any) {
      return { ok: false, message: err?.message ?? String(err) }
    }
  }

  async resolveInstrument(symbol: string): Promise<InstrumentDefinition> {
    if (!this.apiKey) throw new Error('API key required')
    try {
      const url = 'https://api.databento.com/v1/symbology/resolve'
      const body = { input: symbol, input_type: 'raw_symbol', output_type: 'instrument_id' }
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` }, body: JSON.stringify(body) })
      if (!resp.ok) throw new Error(`resolve failed ${resp.status}`)
      const json = await resp.json()
      // Expecting some array or object — map gracefully
      const instrumentId = json?.data?.[0]?.instrument_id ?? `${symbol.toUpperCase()}:ID`
      return {
        instrumentId,
        symbol: symbol.toUpperCase(),
        displaySymbol: symbol.toUpperCase(),
        expiry: undefined,
        multiplier: 1,
        ticksize: 0.01
      }
    } catch (err:any) {
      Logger.warn('RealDatabentoAdapter', 'resolve fallback', err?.message ?? String(err))
      return { instrumentId: `${symbol.toUpperCase()}:ID`, symbol: symbol.toUpperCase(), displaySymbol: symbol.toUpperCase(), expiry: undefined, multiplier: 1, ticksize: 0.01 }
    }
  }
  
  async fetchHistoricalBars(symbol: string, start?: string, end?: string, interval?: string) {
    if (!this.apiKey) throw new Error('API key required')
    try {
      // Databento historical endpoint is dataset scoped; this is a best-effort example and may need adjustment.
      const dataset = this.dataset ?? ''
      const url = `https://api.databento.com/v1/historical?dataset=${encodeURIComponent(dataset)}&symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval ?? '1s')}`
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${this.apiKey}` } })
      if (!resp.ok) throw new Error(`historical ${resp.status}`)
      const json = await resp.json()
      // Expect rows with time, o,h,l,c,v. Map defensively.
      const rows = (json?.data ?? json)?.map((r: any) => ({ instrumentId: `${symbol.toUpperCase()}:ID`, t: r.t ?? r.time ?? r.timestamp, o: r.o ?? r.open, h: r.h ?? r.high, l: r.l ?? r.low, c: r.c ?? r.close, v: r.v ?? r.volume }))
      return rows
    } catch (err:any) {
      Logger.warn('RealDatabentoAdapter', 'fetchHistoricalBars failed', err?.message ?? String(err))
      // fallback to an empty array to let the UI handle lack of data gracefully
      return []
    }
  }
}
