import type { TradeIdea, RiskCheckResult, Position, Quote } from '../models'
import Logger from './logger'

export function evaluateTradeIdea(idea: TradeIdea, settings: any, context?: { positions?: Position[]; accountBalance?: number; quotes?: Record<string, Quote>; realizedDailyLoss?: number }): RiskCheckResult[] {
  const results: RiskCheckResult[] = []
  const notional = Math.abs(idea.entry * idea.size)

  const maxNotional = settings?.maxRiskPerTrade ?? 10000
  results.push({
    ruleId: 'max-notional',
    ruleName: 'Max notional per trade',
    severity: notional > maxNotional ? 'fail' : 'pass',
    passed: notional <= maxNotional,
    explanation: notional > maxNotional ? `Notional ${notional.toFixed(2)} exceeds max ${maxNotional}` : `Notional ${notional.toFixed(2)} within limit`,
    inputs: { notional, maxNotional }
  })

  // Stop distance check
  const stopDistance = Math.abs(idea.entry - idea.stop)
  const maxStop = settings?.maxStopPxDistance ?? (idea.entry * 0.1)
  results.push({
    ruleId: 'stop-distance',
    ruleName: 'Stop loss distance',
    severity: stopDistance > maxStop ? 'warning' : 'pass',
    passed: stopDistance <= maxStop,
    explanation: stopDistance > maxStop ? `Stop distance ${stopDistance.toFixed(2)} is larger than recommended ${maxStop.toFixed(2)}` : `Stop distance ${stopDistance.toFixed(2)} within recommended ${maxStop.toFixed(2)}`,
    inputs: { stopDistance, maxStop }
  })

  // Exposure by symbol check (concentration)
  const positions = context?.positions ?? []
  const account = context?.accountBalance ?? (settings?.accountBalance ?? 1000000)
  const symbolExposure = positions.filter(p => p.instrumentId === idea.instrumentId).reduce((s, p) => s + Math.abs(p.avgPrice * p.size), 0)
  const potentialExposure = symbolExposure + notional
  const maxExposurePerSymbol = settings?.maxExposurePerSymbol ?? (account * 0.2)
  results.push({
    ruleId: 'concentration',
    ruleName: 'Concentration / exposure per symbol',
    severity: potentialExposure > maxExposurePerSymbol ? 'warning' : 'pass',
    passed: potentialExposure <= maxExposurePerSymbol,
    explanation: potentialExposure > maxExposurePerSymbol ? `Potential exposure ${potentialExposure.toFixed(2)} exceeds per-symbol limit ${maxExposurePerSymbol.toFixed(2)}` : `Potential exposure ${potentialExposure.toFixed(2)} within per-symbol limit`,
    inputs: { symbolExposure, potentialExposure, maxExposurePerSymbol }
  })

  // Simple liquidity/spread check (best-effort): if stop is too tight relative to price, warn
  if (idea.entry && idea.stop) {
    const pctStop = Math.abs((idea.entry - idea.stop) / idea.entry)
    const maxPct = settings?.maxStopPct ?? 0.15
    results.push({
      ruleId: 'stop-pct',
      ruleName: 'Stop size relative to price',
      severity: pctStop > maxPct ? 'warning' : 'pass',
      passed: pctStop <= maxPct,
      explanation: pctStop > maxPct ? `Stop is ${+(pctStop*100).toFixed(2)}% of price, larger than recommended ${+(maxPct*100).toFixed(2)}%` : `Stop is ${+(pctStop*100).toFixed(2)}% of price`,
      inputs: { pctStop, maxPct }
    })
  }

  // Liquidity / spread check if quotes available
  try {
    const quote = context?.quotes?.[idea.instrumentId]
    if (quote) {
      const spread = Math.abs(quote.ask - quote.bid)
      const maxSpread = settings?.maxSpread ?? (idea.entry * 0.005)
      results.push({
        ruleId: 'spread',
        ruleName: 'Market spread check',
        severity: spread > maxSpread ? 'warning' : 'pass',
        passed: spread <= maxSpread,
        explanation: spread > maxSpread ? `Spread ${spread.toFixed(4)} exceeds recommended ${maxSpread.toFixed(4)}` : `Spread ${spread.toFixed(4)} within recommended ${maxSpread.toFixed(4)}`,
        inputs: { spread, maxSpread }
      })
    }
  } catch (err) {
    Logger.warn('riskEngine', 'spread check failed for instrument', idea.instrumentId, err)
  }

  // Max daily loss check (best-effort if realizedDailyLoss provided)
  if (settings?.maxDailyLoss) {
    const realized = context?.realizedDailyLoss ?? 0
    results.push({
      ruleId: 'max-daily-loss',
      ruleName: 'Max daily loss',
      severity: realized > settings.maxDailyLoss ? 'fail' : 'pass',
      passed: realized <= settings.maxDailyLoss,
      explanation: realized > settings.maxDailyLoss ? `Realized daily loss ${realized} exceeds limit ${settings.maxDailyLoss}` : `Realized daily loss ${realized} within limit`,
      inputs: { realized, limit: settings.maxDailyLoss }
    })
  }

  return results
}

export function marginRequiredForNotional(notional: number, settings: any) {
  const rate = settings?.marginRate ?? 0.02
  return notional * rate
}

export function computeScenario(idea: TradeIdea, settings: any) {
  const notional = Math.abs(idea.entry * idea.size)
  const margin = marginRequiredForNotional(notional, settings)
  const pnlToStop = (idea.direction === 'long') ? (idea.stop - idea.entry) * idea.size : (idea.entry - idea.stop) * idea.size
  const pctRisk = (Math.abs(pnlToStop) / (settings?.accountBalance ?? 1000000))
  return { notional, margin, pnlToStop, pctRisk }
}

// Parametric VaR/CVaR helpers (normal approximation)
export function computeParametricVaR(notional: number, sigma: number, confidence = 0.95) {
  // z for common confidences (fallback)
  const zMap: Record<number, number> = { 0.9: 1.2815515655446004, 0.95: 1.6448536269514722, 0.99: 2.3263478740408408 }
  const z = zMap[confidence] ?? 1.6448536269514722
  return Math.abs(z * sigma * notional)
}

export function computeParametricCVaR(notional: number, sigma: number, confidence = 0.95) {
  // For normal distribution ES = sigma * phi(z)/(1-alpha); phi(z) = (1/sqrt(2pi)) * exp(-z^2/2)
  const zMap: Record<number, number> = { 0.9: 1.2815515655446004, 0.95: 1.6448536269514722, 0.99: 2.3263478740408408 }
  const z = zMap[confidence] ?? 1.6448536269514722
  const phi = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z)
  const es = sigma * (phi / (1 - confidence))
  return Math.abs(es * notional)
}

export function computePortfolioVaR(positions: any[], settings: any) {
  const totalNotional = positions.reduce((s, p) => s + Math.abs(p.avgPrice * p.size), 0)
  // estimate volatility from settings or default
  const sigma = settings?.portfolioVol ?? 0.02
  const confidence = settings?.varConfidence ?? 0.95
  const varVal = computeParametricVaR(totalNotional, sigma, confidence)
  const cvarVal = computeParametricCVaR(totalNotional, sigma, confidence)
  return { totalNotional, sigma, confidence, var: varVal, cvar: cvarVal }
}
