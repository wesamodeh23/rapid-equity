import React, { useState } from 'react'
import { useAppState } from '../context/AppState'

export default function TradeLedger() {
  const { state } = useAppState()
  const [filter, setFilter] = useState('')

  const rows = state.trades.filter(t => !filter || t.instrumentId.toLowerCase().includes(filter.toLowerCase()))

  function downloadCSV() {
    const header = ['instrumentId,price,size,side,time']
    const lines = rows.map(r => `${r.instrumentId},${r.price},${r.size},${r.side},${r.time}`)
    const csv = header.concat(lines).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trades_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1>Trade Ledger</h1>
      <div className="card">
        <div className="form-row">
          <input placeholder="filter by symbol" value={filter} onChange={e => setFilter(e.target.value)} />
          <button className="btn" onClick={downloadCSV}>Export CSV</button>
        </div>

        <table className="table" style={{ marginTop: 12 }}>
          <thead><tr><th>#</th><th>Symbol</th><th>Size</th><th>Price</th><th>Side</th><th>Time</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="muted">No trades recorded</td></tr>}
            {rows.map((t,i) => (
              <tr key={i}><td>{i+1}</td><td>{t.instrumentId}</td><td>{t.size}</td><td>{t.price}</td><td>{t.side}</td><td className="small muted">{new Date(t.time).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
