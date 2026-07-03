import React, { useState } from 'react'
import { useAppState } from '../context/AppState'
import useTradeMetrics from '../hooks/useTradeMetrics'
import Explanation from '../components/Explanation'
import { formatTime } from '../lib/formatters'
import EmptyTableRow from '../components/EmptyTableRow'

export default function OrderFlow() {
  const { state } = useAppState()
  const [selected, setSelected] = useState(state.watchlist[0] ?? '')
  const instrumentId = selected ? `${selected}:ID` : ''
  const metrics = instrumentId ? useTradeMetrics(state.trades, instrumentId) : null

  return (
    <div>
      <h1>Order Flow (Time & Sales)</h1>
      <div className="card">
        <div className="form-row">
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            {state.watchlist.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <div style={{ marginLeft: 12 }} className="muted small">Showing recent tape and derived metrics for selected symbol.</div>
        </div>

        {metrics ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="card small">
                <div className="muted small">Buy/Sell Imbalance</div>
                <div style={{ fontWeight: 700 }}>{(metrics.imbalance * 100).toFixed(1)}%</div>
                <Explanation text="Net buy volume minus sell volume divided by total volume. Positive indicates buy-side aggression." why="Used to detect directional buying or selling pressure." goodBad="Strong positive: buy pressure; strong negative: sell pressure." />
              </div>
              <div className="card small">
                <div className="muted small">VWAP (recent)</div>
                <div style={{ fontWeight: 700 }}>{metrics.vwap.toFixed(2)}</div>
                <Explanation text="Volume-weighted average price of recent trades." why="Shows executed average price vs current quote." />
              </div>
              <div className="card small">
                <div className="muted small">Avg Trade Size</div>
                <div style={{ fontWeight: 700 }}>{metrics.avgSize.toFixed(1)}</div>
                <Explanation text="Average trade size over the sample window. Large sizes imply institutional activity." />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <table className="table">
                <thead><tr><th>Price</th><th>Size</th><th>Side</th><th>Time</th></tr></thead>
                <tbody>
                  {metrics.recent.length === 0 && <EmptyTableRow colSpan={4} message="No recent trades for this symbol." />}
                  {metrics.recent.map((t, i) => (
                    <tr key={i}><td>{t.price}</td><td>{t.size}</td><td>{t.side}</td><td className="small muted">{formatTime(t.time)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="muted">Select a symbol to see derived tape metrics.</div>
        )}
      </div>
    </div>
  )
}
