import type { DatabentoAdapter } from '../providers/databento/DatabentoAdapter'
import type { InstrumentDefinition } from '../models'

const CACHE_KEY = 'refcache_v1'
const DEFAULT_TTL = 1000 * 60 * 60 // 1 hour

type CacheEntry = { value: InstrumentDefinition; expiresAt: number }

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (err) {
    return {}
  }
}

function writeCache(obj: Record<string, CacheEntry>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)) } catch (err) { /* ignore */ }
}

export async function getInstrument(adapter: DatabentoAdapter, symbol: string, ttl = DEFAULT_TTL): Promise<InstrumentDefinition> {
  const key = symbol.toUpperCase()
  const cache = readCache()
  const existing = cache[key]
  if (existing && existing.expiresAt > Date.now()) return existing.value

  // fetch via adapter
  const def = await adapter.resolveInstrument(symbol)
  cache[key] = { value: def, expiresAt: Date.now() + ttl }
  writeCache(cache)
  return def
}

export function invalidateInstrument(symbol: string) {
  const cache = readCache()
  delete cache[symbol.toUpperCase()]
  writeCache(cache)
}
