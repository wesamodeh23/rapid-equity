import React from 'react'
import { useAppState } from '../context/AppState'
import EmptyTableRow from '../components/EmptyTableRow'

export default function Positions() {
  const { state } = useAppState()

  return (
    <div>
      <h1>Positions</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Instrument</th><th>Side</th><th>Size</th><th>Avg Price</th></tr>
          </thead>
          <tbody>
            {state.positions.length === 0 && <EmptyTableRow colSpan={4} message="No positions." />}
            {state.positions.map(p => (
              <tr key={p.id}>
                <td>{p.instrumentId}</td>
                <td>{p.side}</td>
                <td>{p.size}</td>
                <td>{p.avgPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
