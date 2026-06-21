import type { TradeIdea, RiskCheckResult } from '../models'

export function scoreTrade(idea: TradeIdea, riskChecks: RiskCheckResult[]) {
  const modelScore = Math.max(0, Math.min(1, idea.score ?? Math.random()))
  const fails = riskChecks.filter(r => r.severity === 'fail' && !r.passed).length
  const warns = riskChecks.filter(r => r.severity === 'warning' && !r.passed).length
  const penalty = Math.min(0.95, fails * 0.5 + warns * 0.2)
  const regimeFit = 0.8 + (Math.random() * 0.4 - 0.2) // pseudo regime fit 0.6-1.0
  const finalScore = Math.max(0, modelScore * (1 - penalty) * regimeFit)
  return { modelScore, fails, warns, penalty, regimeFit, finalScore }
}
