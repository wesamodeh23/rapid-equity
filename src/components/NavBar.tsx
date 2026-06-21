import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAppState } from '../context/AppState'

const links = [
  ['Overview', '/overview'],
  ['Market Monitor', '/market-monitor'],
  ['Order Flow', '/order-flow'],
  ['LOB / Heatmap', '/lob'],
  ['Research', '/research'],
  ['Trade Generator', '/trade-generator'],
  ['Pre-Trade', '/pre-trade'],
  ['Positions', '/positions'],
  ['Risk', '/risk'],
  ['Execution Review', '/execution-review'],
  ['Trade Ledger', '/trade-ledger'],
  ['Journal', '/journal'],
  ['Macro', '/macro'],
  ['Settings', '/settings']
]

export default function NavBar() {
  const { state } = useAppState()

  return (
    <nav className="nav">
      <h2>Rapid Equity</h2>
      {links.map(([label, to]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {label}
        </NavLink>
      ))}

      <div style={{ marginTop: 12 }} className="card small muted">
        <div>Provider: {state.providerStatus.mode}</div>
        <div className="small">Status: {state.providerStatus.connected ? 'connected' : 'disconnected'}</div>
        <div className="small">Last: {state.providerStatus.lastUpdate ? new Date(state.providerStatus.lastUpdate).toLocaleTimeString() : '—'}</div>
      </div>
    </nav>
  )
}
