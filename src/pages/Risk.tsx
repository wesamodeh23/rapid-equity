import React from 'react'
import { useAppState } from '../context/AppState'
import { marginRequiredForNotional, computePortfolioVaR } from '../lib/riskEngine'

export default function Risk() {
  const { state, dispatch } = useAppState()

  function updateMaxRisk(v: number) {
    dispatch({ type: 'SET_SETTINGS', payload: { maxRiskPerTrade: v } })
  }

  const totalNotional = state.positions.reduce((s, p) => s + Math.abs(p.avgPrice * p.size), 0)
  const margin = marginRequiredForNotional(totalNotional, state.settings)
  const vaR = computePortfolioVaR(state.positions, state.settings)

  return (
    <div>
      <h1>Risk Dashboard</h1>
      <div className="card">
        <div className="form-row">
          <div>
            <div className="muted small">Max risk per trade</div>
            <div>${state.settings.maxRiskPerTrade}</div>
          </div>
          <div>
            <button className="btn" onClick={() => updateMaxRisk((state.settings.maxRiskPerTrade ?? 0) + 1000)}>Increase</button>
            <button className="btn ghost" onClick={() => updateMaxRisk((state.settings.maxRiskPerTrade ?? 0) - 1000)}>Decrease</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="muted small">Total positions notional: ${totalNotional.toFixed(2)}</div>
          <div className="muted small">Estimated margin required: ${margin.toFixed(2)}</div>
          <div style={{ marginTop: 8 }}>
            <div className="muted small">Portfolio VaR ({(vaR.confidence*100).toFixed(0)}%): ${vaR.var.toFixed(2)}</div>
            <div className="muted small">Portfolio CVaR (ES): ${vaR.cvar.toFixed(2)}</div>
          </div>
        </div>

        <div className="muted small" style={{ marginTop: 8 }}>Risk rules are evaluated per candidate trade and explained in the Pre-Trade tab.</div>
      </div>
    </div>
  )
}
