import { describe, test, expect } from 'vitest'
import { marginRequiredForNotional, computeScenario } from '../riskEngine'

describe('riskEngine helpers', () => {
  test('marginRequiredForNotional uses marginRate setting', () => {
    expect(marginRequiredForNotional(100000, { marginRate: 0.05 })).toBeCloseTo(5000)
  })

  test('computeScenario produces sensible outputs', () => {
    const idea = { entry: 100, size: 10, stop: 95, direction: 'long' } as any
    const settings = { marginRate: 0.02, accountBalance: 100000 }
    const sc = computeScenario(idea, settings)
    expect(sc.notional).toBe(1000)
    expect(sc.margin).toBeCloseTo(20)
    expect(sc.pnlToStop).toBe((95 - 100) * 10)
    expect(sc.pctRisk).toBeCloseTo(Math.abs(sc.pnlToStop) / settings.accountBalance)
  })
})
