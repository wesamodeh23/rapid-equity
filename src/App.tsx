import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import ErrorBoundary from './components/ErrorBoundary'
import Overview from './pages/Overview'
import MarketMonitor from './pages/MarketMonitor'
import OrderFlow from './pages/OrderFlow'
import LOBHeatmap from './pages/LOBHeatmap'
import Research from './pages/Research'
import TradeGenerator from './pages/TradeGenerator'
import PreTradeApproval from './pages/PreTradeApproval'
import Positions from './pages/Positions'
import Risk from './pages/Risk'
import ExecutionReview from './pages/ExecutionReview'
import TradeLedger from './pages/TradeLedger'
import Journal from './pages/Journal'
import Macro from './pages/Macro'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavBar />
        <main className="main-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/market-monitor" element={<MarketMonitor />} />
              <Route path="/order-flow" element={<OrderFlow />} />
              <Route path="/lob" element={<LOBHeatmap />} />
              <Route path="/research" element={<Research />} />
              <Route path="/trade-generator" element={<TradeGenerator />} />
              <Route path="/pre-trade" element={<PreTradeApproval />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/risk" element={<Risk />} />
              <Route path="/execution-review" element={<ExecutionReview />} />
              <Route path="/trade-ledger" element={<TradeLedger />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/macro" element={<Macro />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  )
}
