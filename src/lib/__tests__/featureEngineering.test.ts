import { describe, test, expect } from 'vitest'
import { spread, midPrice } from '../featureEngineering'
import type { Quote } from '../../models'

function makeQuote(bid: number, ask: number): Quote {
  return { instrumentId: 'TEST:ID', bid, ask, last: (bid + ask) / 2, volume: 100, time: '2024-01-01T00:00:00Z' }
}

describe('featureEngineering', () => {
  describe('spread', () => {
    test('computes ask - bid rounded to 4 decimals', () => {
      expect(spread(makeQuote(100, 100.05))).toBe(0.05)
    })

    test('returns 0 when bid equals ask', () => {
      expect(spread(makeQuote(50, 50))).toBe(0)
    })

    test('handles sub-penny spreads', () => {
      expect(spread(makeQuote(99.9999, 100.0001))).toBe(0.0002)
    })

    test('handles large spreads', () => {
      expect(spread(makeQuote(90, 110))).toBe(20)
    })
  })

  describe('midPrice', () => {
    test('computes average of bid and ask', () => {
      expect(midPrice(makeQuote(100, 102))).toBe(101)
    })

    test('returns exact bid/ask when equal', () => {
      expect(midPrice(makeQuote(50, 50))).toBe(50)
    })

    test('rounds to 4 decimals', () => {
      expect(midPrice(makeQuote(100.001, 100.002))).toBe(100.0015)
    })

    test('handles fractional prices', () => {
      expect(midPrice(makeQuote(99.99, 100.01))).toBe(100)
    })
  })
})
