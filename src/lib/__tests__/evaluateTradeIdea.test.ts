import { describe, test, expect } from 'vitest'
import { evaluateTradeIdea } from '../riskEngine'
import type { TradeIdea, Position, Quote } from '../../models'

function makeIdea(overrides: Partial<TradeIdea> = {}): TradeIdea {
  return {
    id: '1',
    instrumentId: 'AAPL:ID',
    direction: 'long',
    entry: 100,
    stop: 95,
    size: 10,
    score: 0.8,
    ...overrides
  }
}

describe('evaluateTradeIdea', () => {
  test('returns pass for max-notional when within limit', () => {
    const results = evaluateTradeIdea(makeIdea(), { maxRiskPerTrade: 5000 })
    const rule = results.find(r => r.ruleId === 'max-notional')!
    expect(rule.passed).toBe(true)
    expect(rule.severity).toBe('pass')
  })

  test('returns fail for max-notional when exceeding limit', () => {
    const results = evaluateTradeIdea(makeIdea({ entry: 200, size: 100 }), { maxRiskPerTrade: 5000 })
    const rule = results.find(r => r.ruleId === 'max-notional')!
    expect(rule.passed).toBe(false)
    expect(rule.severity).toBe('fail')
    expect(rule.explanation).toContain('exceeds max')
  })

  test('uses default maxRiskPerTrade of 10000 when not set', () => {
    const results = evaluateTradeIdea(makeIdea({ entry: 100, size: 50 }), {})
    const rule = results.find(r => r.ruleId === 'max-notional')!
    // notional = 5000, default max = 10000 → pass
    expect(rule.passed).toBe(true)
  })

  test('stop-distance rule passes when within limit', () => {
    const results = evaluateTradeIdea(makeIdea({ entry: 100, stop: 95 }), { maxStopPxDistance: 10 })
    const rule = results.find(r => r.ruleId === 'stop-distance')!
    expect(rule.passed).toBe(true)
    expect(rule.severity).toBe('pass')
  })

  test('stop-distance rule warns when exceeding limit', () => {
    const results = evaluateTradeIdea(makeIdea({ entry: 100, stop: 80 }), { maxStopPxDistance: 5 })
    const rule = results.find(r => r.ruleId === 'stop-distance')!
    expect(rule.passed).toBe(false)
    expect(rule.severity).toBe('warning')
    expect(rule.explanation).toContain('larger than recommended')
  })

  test('stop-distance defaults to 10% of entry when maxStopPxDistance not set', () => {
    // entry = 100, stop = 89 → distance = 11, default max = 100*0.1 = 10 → warning
    const results = evaluateTradeIdea(makeIdea({ entry: 100, stop: 89 }), {})
    const rule = results.find(r => r.ruleId === 'stop-distance')!
    expect(rule.passed).toBe(false)
    expect(rule.severity).toBe('warning')
  })

  test('concentration rule passes when exposure within limit', () => {
    const results = evaluateTradeIdea(makeIdea(), { accountBalance: 100000 })
    const rule = results.find(r => r.ruleId === 'concentration')!
    // notional = 1000, no existing positions, max = 100000*0.2 = 20000
    expect(rule.passed).toBe(true)
  })

  test('concentration rule warns when exposure exceeds per-symbol limit', () => {
    const positions: Position[] = [
      { id: 'p1', instrumentId: 'AAPL:ID', size: 200, avgPrice: 100, side: 'long' }
    ]
    // existing exposure = 20000, new notional = 1000, total = 21000, maxExposure = 100000*0.2 = 20000
    const results = evaluateTradeIdea(makeIdea(), { accountBalance: 100000 }, { positions })
    const rule = results.find(r => r.ruleId === 'concentration')!
    expect(rule.passed).toBe(false)
    expect(rule.severity).toBe('warning')
  })

  test('concentration uses custom maxExposurePerSymbol setting', () => {
    const results = evaluateTradeIdea(makeIdea(), { maxExposurePerSymbol: 500 })
    const rule = results.find(r => r.ruleId === 'concentration')!
    // notional = 1000 > 500
    expect(rule.passed).toBe(false)
  })

  test('stop-pct rule passes when stop percentage within limit', () => {
    // entry = 100, stop = 95 → pctStop = 5% < default maxPct = 15%
    const results = evaluateTradeIdea(makeIdea(), {})
    const rule = results.find(r => r.ruleId === 'stop-pct')!
    expect(rule.passed).toBe(true)
  })

  test('stop-pct rule warns when stop percentage exceeds maxStopPct', () => {
    // entry = 100, stop = 50 → pctStop = 50% > maxStopPct = 15%
    const results = evaluateTradeIdea(makeIdea({ entry: 100, stop: 50 }), {})
    const rule = results.find(r => r.ruleId === 'stop-pct')!
    expect(rule.passed).toBe(false)
    expect(rule.severity).toBe('warning')
  })

  test('spread rule passes when spread is within limit', () => {
    const quotes: Record<string, Quote> = {
      'AAPL:ID': { instrumentId: 'AAPL:ID', bid: 99.99, ask: 100.01, last: 100, volume: 1000, time: '2024-01-01T00:00:00Z' }
    }
    const results = evaluateTradeIdea(makeIdea(), { maxSpread: 0.1 }, { quotes })
    const rule = results.find(r => r.ruleId === 'spread')!
    expect(rule.passed).toBe(true)
    expect(rule.severity).toBe('pass')
  })

  test('spread rule warns when spread exceeds limit', () => {
    const quotes: Record<string, Quote> = {
      'AAPL:ID': { instrumentId: 'AAPL:ID', bid: 99, ask: 101, last: 100, volume: 1000, time: '2024-01-01T00:00:00Z' }
    }
    const results = evaluateTradeIdea(makeIdea(), { maxSpread: 0.5 }, { quotes })
    const rule = results.find(r => r.ruleId === 'spread')!
    expect(rule.passed).toBe(false)
    expect(rule.severity).toBe('warning')
  })

  test('spread rule is not added when no quotes available', () => {
    const results = evaluateTradeIdea(makeIdea(), {})
    const rule = results.find(r => r.ruleId === 'spread')
    expect(rule).toBeUndefined()
  })

  test('max-daily-loss rule passes when within limit', () => {
    const results = evaluateTradeIdea(makeIdea(), { maxDailyLoss: 5000 }, { realizedDailyLoss: 1000 })
    const rule = results.find(r => r.ruleId === 'max-daily-loss')!
    expect(rule.passed).toBe(true)
    expect(rule.severity).toBe('pass')
  })

  test('max-daily-loss rule fails when exceeded', () => {
    const results = evaluateTradeIdea(makeIdea(), { maxDailyLoss: 5000 }, { realizedDailyLoss: 6000 })
    const rule = results.find(r => r.ruleId === 'max-daily-loss')!
    expect(rule.passed).toBe(false)
    expect(rule.severity).toBe('fail')
    expect(rule.explanation).toContain('exceeds limit')
  })

  test('max-daily-loss rule defaults realized to 0 when not provided', () => {
    const results = evaluateTradeIdea(makeIdea(), { maxDailyLoss: 5000 })
    const rule = results.find(r => r.ruleId === 'max-daily-loss')!
    expect(rule.passed).toBe(true)
  })

  test('max-daily-loss rule is not added when maxDailyLoss setting is absent', () => {
    const results = evaluateTradeIdea(makeIdea(), {})
    const rule = results.find(r => r.ruleId === 'max-daily-loss')
    expect(rule).toBeUndefined()
  })

  test('negative size is handled via Math.abs for notional', () => {
    const results = evaluateTradeIdea(makeIdea({ size: -10 }), { maxRiskPerTrade: 5000 })
    const rule = results.find(r => r.ruleId === 'max-notional')!
    // notional = |100 * -10| = 1000
    expect(rule.inputs?.notional).toBe(1000)
    expect(rule.passed).toBe(true)
  })
})
