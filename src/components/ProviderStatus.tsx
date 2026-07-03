import React from 'react'
import { useAppState } from '../context/AppState'
import { formatTime } from '../lib/formatters'

/** Displays provider connection status (mode, connected, last update) */
export default function ProviderStatus({ compact }: { compact?: boolean }) {
  const { state } = useAppState()
  const { mode, connected, lastUpdate } = state.providerStatus

  if (compact) {
    return (
      <div className="card small muted">
        <div>Provider: {mode}</div>
        <div className="small">Status: {connected ? 'connected' : 'disconnected'}</div>
        <div className="small">Last: {lastUpdate ? formatTime(lastUpdate) : '—'}</div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>Health</h3>
      <div className="muted small">Provider: {mode}</div>
      <div className="muted small">Connected: {connected ? 'yes' : 'no'}</div>
      <div className="muted small">Last update: {lastUpdate ? new Date(lastUpdate).toLocaleString() : '—'}</div>
    </div>
  )
}
