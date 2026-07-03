import React from 'react'

/** Renders a single-cell muted row when a table has no data */
export default function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="muted">{message}</td>
    </tr>
  )
}
