import type { Position } from '../models'

/** Compute total notional value across a set of positions */
export function computeTotalNotional(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + Math.abs(p.avgPrice * p.size), 0)
}

/** Compute notional exposure for a single symbol */
export function computeSymbolExposure(positions: Position[], instrumentId: string): number {
  return positions
    .filter(p => p.instrumentId === instrumentId)
    .reduce((sum, p) => sum + Math.abs(p.avgPrice * p.size), 0)
}
