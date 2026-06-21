import React from 'react'
import { useAppState } from '../context/AppState'

export default function HealthPanel() {
  const { state } = useAppState()
  return (
    <div className="card">
      <h3>Health</h3>
      <div className="muted small">Provider: {state.providerStatus.mode}</div>
      <div className="muted small">Connected: {state.providerStatus.connected ? 'yes' : 'no'}</div>
      <div className="muted small">Last update: {state.providerStatus.lastUpdate ? new Date(state.providerStatus.lastUpdate).toLocaleString() : '—'}</div>
    </div>
  )
}
