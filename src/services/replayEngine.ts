import type { Quote, Trade } from '../models'
import Logger from '../lib/logger'

type Frame = { quotes?: Quote[]; trades?: Trade[]; t?: string }

export default class ReplayEngine {
  private running = false
  private handle?: number
  private speed = 1
  private frames: Frame[] = []
  private i = 0
  private onQuote: (q: Quote) => void
  private onTrade: (t: Trade) => void

  constructor(onQuote: (q: Quote) => void, onTrade: (t: Trade) => void) {
    this.onQuote = onQuote
    this.onTrade = onTrade
  }

  async loadFromUrl(url: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load replay data')
    this.frames = await res.json()
    this.i = 0
    Logger.info('ReplayEngine', `Loaded ${this.frames.length} frames`)
  }

  loadFromFrames(frames: Frame[]) {
    this.frames = frames
    this.i = 0
    Logger.info('ReplayEngine', `Loaded ${this.frames.length} frames (in-memory)`)
  }

  start(speed = 1) {
    if (this.running) return
    this.speed = speed
    this.running = true
    this.tick()
  }

  stop() {
    this.running = false
    if (this.handle) window.clearTimeout(this.handle)
  }

  private tick() {
    if (!this.running) return
    const frame = this.frames[this.i]
    if (frame) {
      if (frame.quotes) frame.quotes.forEach(q => this.onQuote(q))
      if (frame.trades) frame.trades.forEach(t => this.onTrade(t))
    }
    this.i++
    if (this.i >= this.frames.length) {
      this.running = false
      Logger.info('ReplayEngine', 'Replay finished')
      return
    }
    this.handle = window.setTimeout(() => this.tick(), Math.max(50, 1000 / this.speed))
  }
}
