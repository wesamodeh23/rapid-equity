import React from 'react'
import { NavLink } from 'react-router-dom'
import ProviderStatus from './ProviderStatus'

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
  return (
    <nav className="nav">
      <h2>Rapid Equity</h2>
      {links.map(([label, to]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {label}
        </NavLink>
      ))}

      <div style={{ marginTop: 12 }}>
        <ProviderStatus compact />
      </div>
    </nav>
  )
}
