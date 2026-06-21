import React, { useState } from 'react'

export default function Explanation({ title, text, why, goodBad }:{ title?: string; text: string; why?: string; goodBad?: string }){
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 8 }}>
      <button className="btn ghost" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Explain'}</button>
      {open && (
        <div style={{ marginTop: 8 }} className="muted small">
          {title && <div style={{ fontWeight: 600 }}>{title}</div>}
          <div>{text}</div>
          {why && <div style={{ marginTop: 6 }}><strong>Why this matters:</strong> {why}</div>}
          {goodBad && <div style={{ marginTop: 6 }}><strong>Good vs Bad:</strong> {goodBad}</div>}
        </div>
      )}
    </div>
  )
}
