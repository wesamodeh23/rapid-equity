import { describe, test, expect } from 'vitest'
import { metricExplanations } from '../explanations'

describe('metricExplanations', () => {
  test('contains spread explanation', () => {
    expect(metricExplanations.spread).toBeDefined()
    expect(metricExplanations.spread).toContain('bid')
  })

  test('contains midprice explanation', () => {
    expect(metricExplanations.midprice).toBeDefined()
    expect(metricExplanations.midprice).toContain('Midpoint')
  })

  test('contains notional explanation', () => {
    expect(metricExplanations.notional).toBeDefined()
    expect(metricExplanations.notional).toContain('notional')
  })

  test('has exactly 3 entries', () => {
    expect(Object.keys(metricExplanations)).toHaveLength(3)
  })
})
