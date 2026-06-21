import React from 'react'
import { metricExplanations } from '../lib/explanations'
import Explanation from './Explanation'

export default function KPI({ label, value, metricKey }: { label: string; value: string | number; metricKey?: string }) {
  const text = metricKey ? metricExplanations[metricKey] : undefined
  return (
    <div className="card kpi">
      <div className="muted small">{label}</div>
      <div className="value">{value}</div>
      {text && <div className="muted small">{text.split('.').slice(0,1).join('.') + '.'}</div>}
      {text && <Explanation text={text} why={undefined} goodBad={undefined} />}
    </div>
  )
}
