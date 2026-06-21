import React, { createContext, useContext, useEffect, useReducer } from 'react'
import type { Instrument, Quote, Trade, TradeIdea, Position, JournalEntry } from '../models'
import MockDatabentoAdapter from '../providers/databento/MockDatabentoAdapter'
import type { DatabentoAdapter } from '../providers/databento/DatabentoAdapter'
import RealDatabentoAdapter from '../providers/databento/RealDatabentoAdapter'

type Settings = {
  databentoApiKey?: string
  dataset?: string
  maxRiskPerTrade?: number
  maxDailyLoss?: number
  maxStopPxDistance?: number
  replayMode?: boolean
}

type ProviderStatus = { connected: boolean; lastUpdate?: number; mode: 'mock' | 'live' | 'historical' }

type AppState = {
  settings: Settings
  watchlist: string[]
  instruments: Record<string, Instrument>
  quotes: Record<string, Quote>
  trades: Trade[]
  positions: Position[]
  tradeIdeas: TradeIdea[]
  journal: JournalEntry[]
  providerStatus: ProviderStatus
}

const initialState: AppState = {
  settings: { maxRiskPerTrade: 10000, maxDailyLoss: 20000, maxStopPxDistance: 5, replayMode: false },
  watchlist: ['AAPL', 'ESZ3', 'CLZ3'],
  instruments: {},
  quotes: {},
  trades: [],
  positions: [],
  tradeIdeas: [],
  journal: [],
  providerStatus: { connected: false, lastUpdate: undefined, mode: 'mock' }
}

type Action =
  | { type: 'SET_SETTINGS'; payload: Partial<Settings> }
  | { type: 'ADD_WATCHLIST'; payload: string }
  | { type: 'UPDATE_QUOTE'; payload: Quote }
  | { type: 'ADD_TRADE'; payload: Trade }
  | { type: 'ADD_TRADE_IDEA'; payload: TradeIdea }
  | { type: 'APPROVE_TRADE_IDEA'; payload: { id: string } }
  | { type: 'REGISTER_INSTRUMENT'; payload: Instrument }
  | { type: 'UPDATE_PROVIDER_STATUS'; payload: Partial<ProviderStatus> }
  | { type: 'ADD_POSITION'; payload: Position }
  | { type: 'ADD_JOURNAL'; payload: JournalEntry }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'ADD_WATCHLIST':
      if (state.watchlist.includes(action.payload)) return state
      return { ...state, watchlist: [...state.watchlist, action.payload] }
    case 'UPDATE_QUOTE':
      return { ...state, quotes: { ...state.quotes, [action.payload.instrumentId]: action.payload }, providerStatus: { ...state.providerStatus, lastUpdate: Date.now() } }
    case 'ADD_TRADE':
      return { ...state, trades: [action.payload, ...state.trades] }
    case 'ADD_TRADE_IDEA':
      return { ...state, tradeIdeas: [action.payload, ...state.tradeIdeas] }
    case 'REGISTER_INSTRUMENT':
      return { ...state, instruments: { ...state.instruments, [action.payload.id]: action.payload } }
    case 'APPROVE_TRADE_IDEA':
      return { ...state, tradeIdeas: state.tradeIdeas.map(t => t.id === action.payload.id ? { ...t, approved: true } : t) }
    case 'UPDATE_PROVIDER_STATUS':
      return { ...state, providerStatus: { ...state.providerStatus, ...action.payload } }
    case 'ADD_POSITION':
      return { ...state, positions: [action.payload, ...state.positions] }
    case 'ADD_JOURNAL':
      return { ...state, journal: [action.payload, ...state.journal] }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
  adapter: DatabentoAdapter | null
  setAdapter: (a: DatabentoAdapter | null) => void
} | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [adapter, setAdapter] = React.useState<DatabentoAdapter | null>(() => new MockDatabentoAdapter())

  useEffect(() => {
    if (!adapter) return
    let unsubQ: (() => void) | null = null
    let unsubT: (() => void) | null = null

    let mounted = true
    adapter.connect().then(() => {
      if (!mounted) return
      const mode = (adapter.constructor && adapter.constructor.name && adapter.constructor.name.toLowerCase().includes('mock')) ? 'mock' : 'live'
      dispatch({ type: 'UPDATE_PROVIDER_STATUS', payload: { connected: true, mode: mode as any, lastUpdate: Date.now() } })
      try {
        unsubQ = adapter.subscribeQuotes((q) => dispatch({ type: 'UPDATE_QUOTE', payload: q }))
        unsubT = adapter.subscribeTrades((t) => dispatch({ type: 'ADD_TRADE', payload: t }))
      } catch (err) {
        // adapter may not implement subscriptions yet
        // eslint-disable-next-line no-console
        console.warn('Adapter subscriptions not available', err)
      }
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Adapter connect failed', err)
      dispatch({ type: 'UPDATE_PROVIDER_STATUS', payload: { connected: false } })
    })

    return () => {
      mounted = false
      if (unsubQ) unsubQ()
      if (unsubT) unsubT()
      try { adapter.disconnect() } catch {}
    }
  }, [adapter])

  // expose adapter for simple page-level access (not required but useful during dev)
  useEffect(() => {
    try { (window as any).__APP_ADAPTER__ = adapter } catch (err) {}
    return () => { try { delete (window as any).__APP_ADAPTER__ } catch (err) {} }
  }, [adapter])

  return (
    <AppContext.Provider value={{ state, dispatch, adapter, setAdapter }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
