import { test, expect } from 'vitest'
import { computeParametricVaR, computeParametricCVaR, computePortfolioVaR } from '../riskEngine'

test('parametric VaR and CVaR produce positive values', () => {
  const notional = 100000
  const sigma = 0.02
  const v = computeParametricVaR(notional, sigma, 0.95)
  const cv = computeParametricCVaR(notional, sigma, 0.95)
  expect(v).toBeGreaterThan(0)
  expect(cv).toBeGreaterThan(0)
})

test('computePortfolioVaR returns combined metrics', () => {
  const positions = [
    { id: 'p1', instrumentId: 'AAPL', avgPrice: 100, size: 10, side: 'long' as const },
    { id: 'p2', instrumentId: 'MSFT', avgPrice: 50, size: -20, side: 'short' as const }
  ]
  const res = computePortfolioVaR(positions, { portfolioVol: 0.01, varConfidence: 0.95 })
  expect(res.totalNotional).toBeGreaterThan(0)
  expect(res.var).toBeGreaterThan(0)
  expect(res.cvar).toBeGreaterThan(0)
})
