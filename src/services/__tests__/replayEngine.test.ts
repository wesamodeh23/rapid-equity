import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import ReplayEngine from '../replayEngine'
import type { Quote, Trade } from '../../models'

// Stub window.setTimeout / clearTimeout for Node environment
vi.stubGlobal('window', {
  setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
  clearTimeout: (id: number) => clearTimeout(id)
})

describe('ReplayEngine', () => {
  let quotesReceived: Quote[]
  let tradesReceived: Trade[]
  let engine: ReplayEngine

  beforeEach(() => {
    quotesReceived = []
    tradesReceived = []
    engine = new ReplayEngine(
      (q) => quotesReceived.push(q),
      (t) => tradesReceived.push(t)
    )
    vi.useFakeTimers()
  })

  afterEach(() => {
    engine.stop()
    vi.useRealTimers()
  })

  test('loadFromFrames stores frames and resets index', () => {
    const frames = [
      { quotes: [{ instrumentId: 'A', bid: 1, ask: 2, last: 1.5, volume: 10, time: 't1' }] }
    ]
    engine.loadFromFrames(frames)
    // No quotes emitted until start
    expect(quotesReceived).toHaveLength(0)
  })

  test('start emits first frame immediately', () => {
    const q: Quote = { instrumentId: 'A', bid: 1, ask: 2, last: 1.5, volume: 10, time: 't1' }
    engine.loadFromFrames([{ quotes: [q] }])
    engine.start()
    expect(quotesReceived).toHaveLength(1)
    expect(quotesReceived[0]).toEqual(q)
  })

  test('emits trades from frames', () => {
    const t: Trade = { instrumentId: 'A', price: 100, size: 5, side: 'buy', time: 't1' }
    engine.loadFromFrames([{ trades: [t] }])
    engine.start()
    expect(tradesReceived).toHaveLength(1)
    expect(tradesReceived[0]).toEqual(t)
  })

  test('processes multiple frames across ticks', () => {
    const q1: Quote = { instrumentId: 'A', bid: 1, ask: 2, last: 1.5, volume: 10, time: 't1' }
    const q2: Quote = { instrumentId: 'B', bid: 3, ask: 4, last: 3.5, volume: 20, time: 't2' }
    engine.loadFromFrames([{ quotes: [q1] }, { quotes: [q2] }])
    engine.start()
    expect(quotesReceived).toHaveLength(1)
    vi.advanceTimersByTime(1100)
    expect(quotesReceived).toHaveLength(2)
    expect(quotesReceived[1]).toEqual(q2)
  })

  test('stop prevents further frame processing', () => {
    const q1: Quote = { instrumentId: 'A', bid: 1, ask: 2, last: 1.5, volume: 10, time: 't1' }
    const q2: Quote = { instrumentId: 'B', bid: 3, ask: 4, last: 3.5, volume: 20, time: 't2' }
    engine.loadFromFrames([{ quotes: [q1] }, { quotes: [q2] }])
    engine.start()
    engine.stop()
    vi.advanceTimersByTime(5000)
    expect(quotesReceived).toHaveLength(1)
  })

  test('handles empty frames gracefully', () => {
    engine.loadFromFrames([{}, { quotes: [] }, { trades: [] }])
    engine.start()
    vi.advanceTimersByTime(5000)
    expect(quotesReceived).toHaveLength(0)
    expect(tradesReceived).toHaveLength(0)
  })

  test('start is idempotent when already running', () => {
    const q: Quote = { instrumentId: 'A', bid: 1, ask: 2, last: 1.5, volume: 10, time: 't1' }
    engine.loadFromFrames([{ quotes: [q] }, { quotes: [q] }])
    engine.start()
    engine.start() // should be no-op
    expect(quotesReceived).toHaveLength(1)
  })

  test('replay stops after last frame', () => {
    const q: Quote = { instrumentId: 'A', bid: 1, ask: 2, last: 1.5, volume: 10, time: 't1' }
    engine.loadFromFrames([{ quotes: [q] }])
    engine.start()
    vi.advanceTimersByTime(5000)
    // Only 1 frame, so only 1 quote emitted
    expect(quotesReceived).toHaveLength(1)
  })

  test('speed parameter affects tick interval', () => {
    const q1: Quote = { instrumentId: 'A', bid: 1, ask: 2, last: 1.5, volume: 10, time: 't1' }
    const q2: Quote = { instrumentId: 'B', bid: 3, ask: 4, last: 3.5, volume: 20, time: 't2' }
    engine.loadFromFrames([{ quotes: [q1] }, { quotes: [q2] }])
    engine.start(10) // 10x speed → 100ms interval
    expect(quotesReceived).toHaveLength(1)
    vi.advanceTimersByTime(150)
    expect(quotesReceived).toHaveLength(2)
  })
})
