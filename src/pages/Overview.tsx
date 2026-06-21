import React, { useState } from 'react'
import { useAppState } from '../context/AppState'
import KPI from '../components/KPI'
import HealthPanel from '../components/HealthPanel'
import { midPrice } from '../lib/featureEngineering'

export default function Overview() {
  const { state, dispatch } = useAppState()
  const [symbol, setSymbol] = useState('')
  const [posForm, setPosForm] = useState({ symbol: '', size: 0, avgPrice: 0, side: 'long' })

  function addWatch() {
    if (!symbol) return
    dispatch({ type: 'ADD_WATCHLIST', payload: symbol.toUpperCase() })
    setSymbol('')
  }

  function submitPos(e: React.FormEvent) {
    e.preventDefault()
    const id = `${posForm.symbol}:${Date.now()}`
    dispatch({ type: 'ADD_POSITION', payload: { id, instrumentId: posForm.symbol, size: posForm.size, avgPrice: posForm.avgPrice, side: posForm.side as any } })
    setPosForm({ symbol: '', size: 0, avgPrice: 0, side: 'long' })
  }

  const topWatch = state.watchlist.slice(0, 6)

  return (
    <div>
      <h1>Overview</h1>
      <div className="grid">
        <KPI label="Account Balance" value="$1,000,000" />
        <KPI label="Realized PnL (today)" value="$2,350" />
        <KPI label="Daily Risk Status" value="Green" metricKey="notional" />
      </div>

      <div className="card">
        <h3>Watchlist</h3>
        <div className="form-row">
          <input placeholder="symbol" value={symbol} onChange={e => setSymbol(e.target.value)} />
          <button className="btn" onClick={addWatch}>Add</button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <table className="table">
              <thead>
                <tr><th>Symbol</th><th>Mid</th><th>Bid</th><th>Ask</th><th>Volume</th></tr>
              </thead>
              <tbody>
                {topWatch.map(s => {
                  const q = state.quotes[`${s}:ID`]
                  return (
                    <tr key={s}>
                      <td>{s}</td>
                      <td>{q ? midPrice(q) : '—'}</td>
                      <td>{q ? q.bid : '—'}</td>
                      <td>{q ? q.ask : '—'}</td>
                      <td>{q ? q.volume : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ width: 320 }}>
            <HealthPanel />
          </div>
        </div>

      </div>

      <div className="card">
        <h3>Manual Position Entry</h3>
        <form onSubmit={submitPos} className="form-row">
          <input placeholder="symbol" value={posForm.symbol} onChange={e => setPosForm({ ...posForm, symbol: e.target.value.toUpperCase() })} />
          <input type="number" placeholder="size" value={posForm.size} onChange={e => setPosForm({ ...posForm, size: Number(e.target.value) })} />
          <input type="number" placeholder="avg price" value={posForm.avgPrice} onChange={e => setPosForm({ ...posForm, avgPrice: Number(e.target.value) })} />
          <select value={posForm.side} onChange={e => setPosForm({ ...posForm, side: e.target.value })}>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <button className="btn" type="submit">Add Position</button>
        </form>
      </div>
    </div>
  )
}
