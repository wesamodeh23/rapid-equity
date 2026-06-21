import React, { useState } from 'react'
import { useAppState } from '../context/AppState'

export default function Journal() {
  const { state, dispatch } = useAppState()
  const [note, setNote] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const entry = { id: `j-${Date.now()}`, notes: note, timestamp: new Date().toISOString() }
    dispatch({ type: 'ADD_JOURNAL', payload: entry as any })
    setNote('')
  }

  return (
    <div>
      <h1>Journal / Post-Trade Review</h1>
      <div className="card">
        <form onSubmit={submit} className="form-row">
          <input placeholder="Write a journal note" value={note} onChange={e => setNote(e.target.value)} />
          <button className="btn" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <h3>Entries</h3>
        <div style={{ marginBottom: 12 }}>
          <strong>Count:</strong> {state.journal.length}
          <div className="muted small">Notes are linked to trades and approvals where applicable.</div>
        </div>
        <ul>
          {state.journal.map(j => <li key={j.id} className="small">{new Date(j.timestamp).toLocaleString()}: {j.notes}</li>)}
          {state.journal.length === 0 && <div className="muted">No journal entries yet.</div>}
        </ul>
      </div>
    </div>
  )
}
