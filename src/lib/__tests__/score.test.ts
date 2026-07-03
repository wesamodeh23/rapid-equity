import { describe, test, expect } from 'vitest'
import { scoreTrade } from '../score'
import type { TradeIdea, RiskCheckResult } from '../../models'

function makeIdea(score: number): TradeIdea {
  return { id: '1', instrumentId: 'AAPL:ID', direction: 'long', entry: 100, stop: 95, size: 10, score }
}

function makeCheck(severity: 'pass' | 'warning' | 'fail', passed: boolean): RiskCheckResult {
  return { ruleId: 'test', ruleName: 'Test', severity, passed, explanation: '' }
}

describe('scoreTrade', () => {
  test('returns finalScore between 0 and 1 for passing checks', () => {
    const result = scoreTrade(makeIdea(0.8), [makeCheck('pass', true)])
    expect(result.finalScore).toBeGreaterThanOrEqual(0)
    expect(result.finalScore).toBeLessThanOrEqual(1)
    expect(result.fails).toBe(0)
    expect(result.warns).toBe(0)
    expect(result.penalty).toBe(0)
  })

  test('applies penalty for failed checks', () => {
    const checks = [makeCheck('fail', false)]
    const result = scoreTrade(makeIdea(0.8), checks)
    expect(result.fails).toBe(1)
    expect(result.penalty).toBe(0.5)
    expect(result.finalScore).toBeLessThan(0.8)
  })

  test('applies penalty for warning checks', () => {
    const checks = [makeCheck('warning', false)]
    const result = scoreTrade(makeIdea(0.8), checks)
    expect(result.warns).toBe(1)
    expect(result.penalty).toBe(0.2)
  })

  test('penalty is cumulative for multiple fails and warnings', () => {
    const checks = [
      makeCheck('fail', false),
      makeCheck('fail', false),
      makeCheck('warning', false)
    ]
    const result = scoreTrade(makeIdea(0.8), checks)
    expect(result.fails).toBe(2)
    expect(result.warns).toBe(1)
    // penalty = min(0.95, 2*0.5 + 1*0.2) = min(0.95, 1.2) = 0.95
    expect(result.penalty).toBe(0.95)
  })

  test('penalty caps at 0.95', () => {
    const checks = Array.from({ length: 5 }, () => makeCheck('fail', false))
    const result = scoreTrade(makeIdea(0.8), checks)
    expect(result.penalty).toBe(0.95)
  })

  test('score is clamped to [0, 1] range', () => {
    const result = scoreTrade(makeIdea(2.0), [])
    expect(result.modelScore).toBeLessThanOrEqual(1)
    expect(result.modelScore).toBeGreaterThanOrEqual(0)
  })

  test('negative idea score is clamped to 0', () => {
    const result = scoreTrade(makeIdea(-1), [])
    expect(result.modelScore).toBe(0)
    expect(result.finalScore).toBe(0)
  })

  test('does not count passed checks with fail severity as failures', () => {
    const checks = [makeCheck('fail', true)]
    const result = scoreTrade(makeIdea(0.8), checks)
    expect(result.fails).toBe(0)
    expect(result.penalty).toBe(0)
  })

  test('does not count passed checks with warning severity as warnings', () => {
    const checks = [makeCheck('warning', true)]
    const result = scoreTrade(makeIdea(0.8), checks)
    expect(result.warns).toBe(0)
  })

  test('regimeFit is between 0.6 and 1.0', () => {
    for (let i = 0; i < 20; i++) {
      const result = scoreTrade(makeIdea(0.5), [])
      expect(result.regimeFit).toBeGreaterThanOrEqual(0.6)
      expect(result.regimeFit).toBeLessThanOrEqual(1.0)
    }
  })

  test('finalScore is non-negative', () => {
    for (let i = 0; i < 20; i++) {
      const checks = Array.from({ length: 3 }, () => makeCheck('fail', false))
      const result = scoreTrade(makeIdea(0.5), checks)
      expect(result.finalScore).toBeGreaterThanOrEqual(0)
    }
  })
})
