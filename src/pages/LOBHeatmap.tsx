import React, { useState } from 'react'
import { useAppState } from '../context/AppState'

function HeatRow({ price, bids, asks, max }: { price: number; bids: number; asks: number; max: number }) {
  const left = Math.round((bids / max) * 100)
  const right = Math.round((asks / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 60, color: '#ff9f9f', textAlign: 'right' }}>{bids}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ height: 18, width: `${left}%`, background: 'linear-gradient(90deg, rgba(255,120,120,0.9), rgba(255,120,120,0.4))' }} />
        <div style={{ width: 80, textAlign: 'center', color: '#cbd7e6' }}>{price.toFixed(2)}</div>
        <div style={{ height: 18, width: `${right}%`, background: 'linear-gradient(90deg, rgba(120,255,180,0.4), rgba(120,255,180,0.9))' }} />
      </div>
      <div style={{ width: 40, color: '#9fffb9' }}>{asks}</div>
    </div>
  )
}

export default function LOBHeatmap() {
  const { state } = useAppState()
  const ids = Object.keys(state.quotes)
  const base = ids[0]
  const [depth, setDepth] = useState(20)

  const rows = new Array(depth).fill(0).map((_, i) => ({ price: (100 + i * 0.25), bids: Math.round(Math.random() * 400), asks: Math.round(Math.random() * 400) }))
  const max = Math.max(...rows.map(r => Math.max(r.bids, r.asks)), 1)

  return (
    <div>
      <h1>Limit Order Book / Heatmap</h1>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="muted small">Instrument: {base ? base.replace(':ID','') : '—'}</div>
          <div className="form-row">
            <label className="muted small">Depth</label>
            <select value={depth} onChange={e => setDepth(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={40}>40</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {rows.map((r, i) => <HeatRow key={i} {...r} max={max} />)}
        </div>
      </div>
    </div>
  )
}
