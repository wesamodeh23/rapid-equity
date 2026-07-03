import React, { useState } from 'react'
import { useAppState } from '../context/AppState'
import { evaluateTradeIdea } from '../lib/riskEngine'
import { scoreTrade } from '../lib/score'
import Explanation from '../components/Explanation'

export default function TradeGenerator() {
  const { state, dispatch } = useAppState()
  const [form, setForm] = useState({ symbol: '', direction: 'long', entry: 0, stop: 0, size: 0 })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.symbol.trim()) return
    if (!Number.isFinite(form.entry) || form.entry <= 0) return
    if (!Number.isFinite(form.stop) || form.stop <= 0) return
    if (!Number.isFinite(form.size) || form.size <= 0) return
    const id = `${form.symbol}:${Date.now()}`
    const idea = { id, instrumentId: form.symbol, direction: form.direction as any, entry: form.entry, stop: form.stop, size: form.size, score: Math.random() }
    const checks = evaluateTradeIdea(idea as any, state.settings, { positions: state.positions, accountBalance: 1000000, quotes: state.quotes })
    dispatch({ type: 'ADD_TRADE_IDEA', payload: { ...idea, riskChecks: checks } as any })
  }

  function autoApprovePassing() {
    state.tradeIdeas.forEach(t => {
      const hasFail = (t.riskChecks ?? []).some((r: any) => r.severity === 'fail' && !r.passed)
      if (!hasFail) dispatch({ type: 'APPROVE_TRADE_IDEA', payload: { id: t.id } })
    })
    dispatch({ type: 'ADD_JOURNAL', payload: { id: `auto-approve-${Date.now()}`, notes: 'Auto-approved passing candidate trades', timestamp: new Date().toISOString() } as any })
  }

  return (
    <div>
      <h1>Trade Generator</h1>
      <div className="card">
        <form onSubmit={submit} className="form-row">
          <input placeholder="symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })} />
          <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <input type="number" placeholder="entry" value={form.entry} onChange={e => setForm({ ...form, entry: Number(e.target.value) })} />
          <input type="number" placeholder="stop" value={form.stop} onChange={e => setForm({ ...form, stop: Number(e.target.value) })} />
          <input type="number" placeholder="size" value={form.size} onChange={e => setForm({ ...form, size: Number(e.target.value) })} />
          <button className="btn" type="submit">Generate</button>
        </form>
      </div>

      <div className="card">
        <h3>Candidate Trades</h3>
        <table className="table">
          <thead>
            <tr><th>Symbol</th><th>Dir</th><th>Entry</th><th>Stop</th><th>Size</th><th>Score</th><th>Details</th></tr>
          </thead>
          <tbody>
            {state.tradeIdeas.map(t => {
              const sc = scoreTrade(t as any, t.riskChecks ?? [])
              return (
                <tr key={t.id}>
                  <td>{t.instrumentId}</td>
                  <td>{t.direction}</td>
                  <td>{t.entry}</td>
                  <td>{t.stop}</td>
                  <td>{t.size}</td>
                  <td>{sc.finalScore.toFixed(2)}</td>
                  <td>
                    <DetailsToggle idea={t} score={sc} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailsToggle({ idea, score }: any) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button className="btn ghost" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Details'}</button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div className="small muted">Model score: {score.modelScore.toFixed(2)}</div>
          <div className="small muted">Penalty: {score.penalty.toFixed(2)}</div>
          <div className="small muted">Regime fit: {score.regimeFit.toFixed(2)}</div>
          <div style={{ marginTop: 8 }}>
            <h4>Risk Checks</h4>
            {idea.riskChecks && idea.riskChecks.map((r: any, i: number) => (
              <div key={i} className="small">{r.ruleName}: {r.passed ? 'pass' : r.severity} — {r.explanation}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
