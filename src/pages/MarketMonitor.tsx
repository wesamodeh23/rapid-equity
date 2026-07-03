import React, { useState } from 'react'
import { useAppState } from '../context/AppState'
import { spread, midPrice } from '../lib/featureEngineering'
import { getInstrument } from '../services/referenceCache'
import { secondsAgo } from '../lib/formatters'
import EmptyTableRow from '../components/EmptyTableRow'

export default function MarketMonitor() {
  const { state, dispatch, adapter } = useAppState()
  const symbols = Object.keys(state.quotes)
  const [symbolInput, setSymbolInput] = useState('')
  const [msg, setMsg] = useState('')

  async function addSymbol() {
    if (!symbolInput) return
    if (!adapter) { setMsg('No data adapter available'); return }
    try {
      const def = await getInstrument(adapter, symbolInput)
      dispatch({ type: 'REGISTER_INSTRUMENT', payload: { id: def.instrumentId, symbol: def.symbol, displaySymbol: def.displaySymbol, type: 'other' } as any })
      dispatch({ type: 'ADD_WATCHLIST', payload: def.symbol })
      setMsg(`Added ${def.displaySymbol}`)
      setSymbolInput('')
    } catch (err:any) {
      setMsg(err?.message ?? String(err))
    }
  }

  return (
    <div>
      <h1>Market Monitor</h1>
      <div className="card">
        <div className="form-row">
          <input placeholder="Add symbol (e.g. AAPL)" value={symbolInput} onChange={e => setSymbolInput(e.target.value)} />
          <button className="btn" onClick={addSymbol}>Add</button>
        </div>
        {msg && <div className="muted small" style={{ marginTop: 8 }}>{msg}</div>}

        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Symbol</th><th>Mid</th><th>Spread</th><th>Bid</th><th>Ask</th><th>Vol</th><th>Last update</th></tr>
          </thead>
          <tbody>
            {symbols.length === 0 && <EmptyTableRow colSpan={7} message="No real-time quotes yet." />}
            {symbols.map(id => {
              const q = state.quotes[id]
              const elapsed = q ? secondsAgo(q.time) : null
              const stale = elapsed !== null && elapsed > 10
              return (
                <tr key={id}>
                  <td>{id.replace(':ID','')}</td>
                  <td>{q ? midPrice(q) : '—'}</td>
                  <td>{q ? spread(q) : '—'}</td>
                  <td>{q ? q.bid : '—'}</td>
                  <td>{q ? q.ask : '—'}</td>
                  <td>{q ? q.volume : '—'}</td>
                  <td className="small muted">{q ? `${elapsed}s${stale ? ' (stale)' : ''}` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
