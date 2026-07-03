import React, { useState } from 'react'
import { useAppState } from '../context/AppState'
import { createJournalEntry } from '../lib/journalEntries'
import { formatDateTime } from '../lib/formatters'

export default function Journal() {
  const { state, dispatch } = useAppState()
  const [note, setNote] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ type: 'ADD_JOURNAL', payload: createJournalEntry(`j-${Date.now()}`, note) })
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
          {state.journal.map(j => <li key={j.id} className="small">{formatDateTime(j.timestamp)}: {j.notes}</li>)}
          {state.journal.length === 0 && <div className="muted">No journal entries yet.</div>}
        </ul>
      </div>
    </div>
  )
}
