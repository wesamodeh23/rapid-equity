import React, { useState } from 'react'
import { useAppState } from '../context/AppState'
import RealDatabentoAdapter from '../providers/databento/RealDatabentoAdapter'
import MockDatabentoAdapter from '../providers/databento/MockDatabentoAdapter'

export default function Settings() {
  const { state, dispatch, adapter, setAdapter } = useAppState()
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('databentoApiKey') ?? state.settings.databentoApiKey ?? '')
  const [dataset, setDataset] = useState(() => localStorage.getItem('databentoDataset') ?? state.settings.dataset ?? '')
  const [testMsg, setTestMsg] = useState('')

  async function testConnection() {
    try {
      // if an adapter is set, use it; otherwise test using a real adapter instance
      if (adapter) {
        const res = await adapter.testConnection()
        setTestMsg(res.message || (res.ok ? 'ok' : 'failed'))
        dispatch({ type: 'UPDATE_PROVIDER_STATUS', payload: { connected: res.ok, lastUpdate: Date.now() } })
        return
      }
      const tmp = new RealDatabentoAdapter(apiKey, dataset)
      const res = await tmp.testConnection()
      setTestMsg(res.message || (res.ok ? 'ok' : 'failed'))
      dispatch({ type: 'UPDATE_PROVIDER_STATUS', payload: { connected: res.ok, lastUpdate: Date.now() } })
    } catch (err: any) {
      setTestMsg(`Connection test error: ${err?.message ?? String(err)}`)
      dispatch({ type: 'UPDATE_PROVIDER_STATUS', payload: { connected: false } })
    }
  }

  function save() {
    // persist to localStorage only
    localStorage.setItem('databentoApiKey', apiKey)
    localStorage.setItem('databentoDataset', dataset)
    dispatch({ type: 'SET_SETTINGS', payload: { databentoApiKey: apiKey, dataset } })
  }

  async function connectLive() {
    if (!apiKey) {
      setTestMsg('Provide an API key first')
      return
    }
    const real = new RealDatabentoAdapter(apiKey, dataset)
    setAdapter(real)
    try {
      await real.connect()
      const res = await real.testConnection()
      setTestMsg(res.message || (res.ok ? 'connected' : 'failed'))
      dispatch({ type: 'UPDATE_PROVIDER_STATUS', payload: { connected: res.ok, lastUpdate: Date.now() } })
    } catch (err: any) {
      setTestMsg(`Live connection failed: ${err?.message ?? String(err)}`)
      dispatch({ type: 'UPDATE_PROVIDER_STATUS', payload: { connected: false } })
      setAdapter(new MockDatabentoAdapter())
    }
  }

  return (
    <div>
      <h1>Settings / Data Sources</h1>
      <div className="card">
        <div className="form-row">
          <div style={{ flex: 1 }}>
            <div className="muted small">Databento API Key</div>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter Databento API key" />
          </div>
          <div style={{ width: 220 }}>
            <div className="muted small">Dataset</div>
            <input value={dataset} onChange={e => setDataset(e.target.value)} placeholder="e.g. bento-prod" />
          </div>
          <div>
            <button className="btn" onClick={save}>Save</button>
            <button className="btn ghost" onClick={testConnection}>Test Connection</button>
          </div>
        </div>
        {testMsg && <div className="muted small" style={{ marginTop: 8 }}>{testMsg}</div>}
      </div>
    </div>
  )
}
