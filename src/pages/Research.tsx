import React, { useState, useRef } from 'react'
import { useAppState } from '../context/AppState'
import ReplayEngine from '../services/replayEngine'

export default function Research() {
  const { state, dispatch, adapter } = useAppState()
  const [replayStatus, setReplayStatus] = useState<'idle'|'running'|'loaded'>('idle')
  const engineRef = useRef<ReplayEngine | null>(null)
  const [symbolInput, setSymbolInput] = useState('')
  const [msg, setMsg] = useState('')

  async function startSampleReplay() {
    setReplayStatus('idle')
    const engine = new ReplayEngine((q) => dispatch({ type: 'UPDATE_QUOTE', payload: q }), (t) => dispatch({ type: 'ADD_TRADE', payload: t }))
    engineRef.current = engine
    try {
      await engine.loadFromUrl('/src/data/sample_historical.json')
      setReplayStatus('loaded')
      engine.start(4)
      setReplayStatus('running')
    } catch (err:any) {
      setReplayStatus('idle')
      // eslint-disable-next-line no-console
      console.error('Replay load failed', err)
    }
  }

  async function queryHistorical() {
    if (!state.settings.databentoApiKey && !state.providerStatus.connected) {
      setReplayStatus('idle')
      setMsg('No adapter configured. Add Databento key in Settings or connect adapter.')
      return
    }
    const target = adapter ?? (window as any).__APP_ADAPTER__ ?? null
    if (!target) {
      setMsg('No adapter available for historical queries (use Settings -> Connect Live)')
      return
    }
    setMsg('Querying historical bars...')
    try {
      const bars = await target.fetchHistoricalBars(symbolInput || 'AAPL', undefined, undefined, '1s')
      if (!bars || bars.length === 0) {
        setMsg('No historical bars returned')
        return
      }
      // transform bars into replay frames
      const frames = bars.map((b: any) => ({ t: b.t, quotes: [{ instrumentId: b.instrumentId, bid: b.c - 0.01, ask: b.c + 0.01, last: b.c, volume: b.v, time: b.t }], trades: [] }))
      const engine = new ReplayEngine((q) => dispatch({ type: 'UPDATE_QUOTE', payload: q }), (t) => dispatch({ type: 'ADD_TRADE', payload: t }))
      engineRef.current = engine
      engine.loadFromFrames(frames)
      engine.start(2)
      setReplayStatus('running')
      setMsg(`Loaded ${frames.length} frames`)
    } catch (err:any) {
      setMsg(err?.message ?? String(err))
    }
  }

  function stopReplay() {
    engineRef.current?.stop()
    setReplayStatus('idle')
  }

  return (
    <div>
      <h1>Research</h1>
      <div className="card">
        <div className="form-row">
          <input placeholder="symbol or query" value={symbolInput} onChange={e => setSymbolInput(e.target.value)} />
          <button className="btn ghost" onClick={queryHistorical}>Search</button>
          {replayStatus !== 'running' ? (
            <button className="btn" onClick={startSampleReplay}>Start Sample Replay</button>
          ) : (
            <button className="btn ghost" onClick={stopReplay}>Stop Replay</button>
          )}
        </div>
        <div className="muted small" style={{ marginTop: 8 }}>{msg || 'Replay mode uses historical data to drive the same downstream components where possible.'}</div>
      </div>
    </div>
  )
}
