import { useMemo } from 'react'
import type { Trade } from '../models'

export default function useTradeMetrics(trades: Trade[], instrumentId: string, lookback = 200) {
  return useMemo(() => {
    const recent = trades.filter(t => t.instrumentId === instrumentId).slice(0, lookback)
    const buyVol = recent.filter(r => r.side === 'buy').reduce((s, r) => s + r.size, 0)
    const sellVol = recent.filter(r => r.side === 'sell').reduce((s, r) => s + r.size, 0)
    const imbalance = buyVol + sellVol === 0 ? 0 : (buyVol - sellVol) / (buyVol + sellVol)
    const tradeCount = recent.length
    const totalSize = recent.reduce((s, r) => s + r.size, 0)
    const vwap = totalSize === 0 ? 0 : recent.reduce((s, r) => s + r.price * r.size, 0) / totalSize
    const avgSize = tradeCount === 0 ? 0 : totalSize / tradeCount
    const lastPrice = recent[0]?.price

    return { recent, buyVol, sellVol, imbalance, tradeCount, vwap, avgSize, lastPrice }
  }, [trades, instrumentId, lookback])
}
