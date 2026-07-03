import React from 'react'
import { useAppState } from '../context/AppState'
import Explanation from '../components/Explanation'
import { computeScenario } from '../lib/riskEngine'
import { createJournalEntry } from '../lib/journalEntries'
import EmptyTableRow from '../components/EmptyTableRow'

export default function PreTradeApproval() {
  const { state, dispatch } = useAppState()

  function approve(id: string) {
    dispatch({ type: 'APPROVE_TRADE_IDEA', payload: { id } })
    dispatch({ type: 'ADD_JOURNAL', payload: createJournalEntry(`auto-approve-${id}`, `Trade ${id} approved via pre-trade UI`) })
  }

  function forceApprove(id: string) {
    const reason = window.prompt('Enter override reason (recorded in journal)')
    approve(id)
    dispatch({ type: 'ADD_JOURNAL', payload: createJournalEntry(`override-${Date.now()}`, `Force approved ${id}: ${reason}`) })
  }

  function canApprove(t: any) {
    if (!t.riskChecks) return false
    return !t.riskChecks.some((r: any) => r.severity === 'fail' && r.passed === false)
  }

  return (
    <div>
      <h1>Pre-Trade Approval</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Symbol</th><th>Entry</th><th>Stop</th><th>Size</th><th>Risk</th><th>Action</th></tr>
          </thead>
          <tbody>
            {state.tradeIdeas.length === 0 && <EmptyTableRow colSpan={6} message="No candidate trades." />}
            {state.tradeIdeas.map(t => (
              <tr key={t.id}>
                <td>{t.instrumentId}</td>
                <td>{t.entry}</td>
                <td>{t.stop}</td>
                <td>{t.size}</td>
                <td>
                  {t.riskChecks && t.riskChecks.map((r, i) => (
                    <div key={i} className="small">{r.ruleName}: {r.passed ? 'pass' : r.severity}</div>
                  ))}
                </td>
                <td>
                  <button className="btn" disabled={!canApprove(t)} onClick={() => approve(t.id)}>Approve</button>
                  <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => forceApprove(t.id)}>Force Approve</button>
                  <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => {
                    const sc = computeScenario(t as any, state.settings)
                    alert(`Scenario:\nNotional: ${sc.notional.toFixed(2)}\nMargin: ${sc.margin.toFixed(2)}\nP&L to stop: ${sc.pnlToStop.toFixed(2)}\n% of account: ${(sc.pctRisk*100).toFixed(2)}%`)
                  }}>What-if</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12 }}>
          <div className="muted small">Click Explain to see human-readable reasoning for each rule.</div>
          {state.tradeIdeas.map(t => (
            <div key={`ex-${t.id}`} style={{ marginTop: 8 }}>
              <strong>{t.instrumentId}</strong>
              {t.riskChecks && t.riskChecks.map((r, i) => (
                <Explanation key={i} text={`${r.ruleName}: ${r.explanation}`} why={undefined} goodBad={undefined} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
