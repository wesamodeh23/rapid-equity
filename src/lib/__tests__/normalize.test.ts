import { describe, test, expect } from 'vitest'
import { normalizeQuote, normalizeTrade, normalizeInstrument } from '../normalize'
import type { Quote, Trade, InstrumentDefinition } from '../../models'

describe('normalize', () => {
  describe('normalizeQuote', () => {
    test('returns the same quote object unchanged', () => {
      const q: Quote = { instrumentId: 'AAPL:ID', bid: 100, ask: 101, last: 100.5, volume: 500, time: '2024-01-01T00:00:00Z' }
      const result = normalizeQuote(q)
      expect(result).toEqual(q)
      expect(result).toBe(q)
    })

    test('preserves all fields', () => {
      const q: Quote = { instrumentId: 'ESZ3:ID', bid: 4500.25, ask: 4500.50, last: 4500.375, volume: 10000, time: '2024-06-15T12:30:00Z' }
      const result = normalizeQuote(q)
      expect(result.instrumentId).toBe('ESZ3:ID')
      expect(result.bid).toBe(4500.25)
      expect(result.ask).toBe(4500.50)
      expect(result.last).toBe(4500.375)
      expect(result.volume).toBe(10000)
    })
  })

  describe('normalizeTrade', () => {
    test('returns the same trade object unchanged', () => {
      const t: Trade = { instrumentId: 'MSFT:ID', price: 350.50, size: 100, side: 'buy', time: '2024-01-01T10:00:00Z' }
      const result = normalizeTrade(t)
      expect(result).toEqual(t)
      expect(result).toBe(t)
    })

    test('preserves sell side', () => {
      const t: Trade = { instrumentId: 'AAPL:ID', price: 150, size: 50, side: 'sell', time: '2024-01-01T10:00:00Z' }
      const result = normalizeTrade(t)
      expect(result.side).toBe('sell')
    })
  })

  describe('normalizeInstrument', () => {
    test('returns the same instrument definition unchanged', () => {
      const def: InstrumentDefinition = {
        instrumentId: 'AAPL:ID',
        symbol: 'AAPL',
        displaySymbol: 'AAPL',
        expiry: undefined,
        multiplier: 1,
        ticksize: 0.01
      }
      const result = normalizeInstrument(def)
      expect(result).toEqual(def)
      expect(result).toBe(def)
    })

    test('preserves optional fields', () => {
      const def: InstrumentDefinition = {
        instrumentId: 'ESZ3:ID',
        symbol: 'ESZ3',
        displaySymbol: 'ESZ3',
        expiry: '2024-12-20',
        multiplier: 50,
        ticksize: 0.25
      }
      const result = normalizeInstrument(def)
      expect(result.expiry).toBe('2024-12-20')
      expect(result.multiplier).toBe(50)
      expect(result.ticksize).toBe(0.25)
    })
  })
})
