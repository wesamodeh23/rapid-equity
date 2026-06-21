import React from 'react'
import { useAppState } from '../context/AppState'

export default function ExecutionReview() {
  const { state, dispatch } = useAppState()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.target as HTMLFormElement)
    const instrumentId = (form.get('symbol') as string) || 'MANUAL:ID'
    const price = Number(form.get('price'))
    const size = Number(form.get('size'))
    const side = (form.get('side') as string) || 'buy'
    const t = new Date().toISOString()
    dispatch({ type: 'ADD_TRADE', payload: { instrumentId, price, size, side, time: t } as any })
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <div>
      <h1>Execution Review</h1>
      <div className="card">
        <div className="muted small">Fill log and execution quality review.</div>
        <form onSubmit={handleSubmit} className="form-row" style={{ marginTop: 8 }}>
          <input name="symbol" placeholder="symbol" />
          <input name="price" placeholder="price" />
          <input name="size" placeholder="size" />
          <select name="side"><option value="buy">Buy</option><option value="sell">Sell</option></select>
          <button className="btn" type="submit">Add Fill</button>
        </form>

        <table className="table" style={{ marginTop: 12 }}>
          <thead><tr><th>Instrument</th><th>Price</th><th>Size</th><th>Time</th></tr></thead>
          <tbody>
            {state.trades.length === 0 && <tr><td colSpan={4} className="muted">No fills</td></tr>}
            {state.trades.slice(0,50).map((t,i) => (
              <tr key={i}><td>{t.instrumentId}</td><td>{t.price}</td><td>{t.size}</td><td className="small muted">{new Date(t.time).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
