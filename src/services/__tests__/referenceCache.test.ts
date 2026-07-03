import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getInstrument, invalidateInstrument } from '../referenceCache'
import type { DatabentoAdapter } from '../../providers/databento/DatabentoAdapter'
import type { InstrumentDefinition } from '../../models'

const CACHE_KEY = 'refcache_v1'

const mockDef: InstrumentDefinition = {
  instrumentId: 'AAPL:ID',
  symbol: 'AAPL',
  displaySymbol: 'AAPL',
  expiry: undefined,
  multiplier: 1,
  ticksize: 0.01
}

function makeAdapter(def: InstrumentDefinition = mockDef): DatabentoAdapter {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeQuotes: vi.fn(),
    subscribeTrades: vi.fn(),
    testConnection: vi.fn(),
    resolveInstrument: vi.fn().mockResolvedValue(def),
    fetchHistoricalBars: vi.fn()
  }
}

// Mock localStorage for Node/Vitest environment
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
  removeItem: vi.fn((key: string) => { delete storage[key] }),
  clear: vi.fn(() => { for (const k of Object.keys(storage)) delete storage[k] })
}
vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

describe('referenceCache', () => {
  describe('getInstrument', () => {
    test('fetches from adapter on cache miss', async () => {
      const adapter = makeAdapter()
      const result = await getInstrument(adapter, 'AAPL')
      expect(adapter.resolveInstrument).toHaveBeenCalledWith('AAPL')
      expect(result).toEqual(mockDef)
    })

    test('returns cached value on subsequent calls', async () => {
      const adapter = makeAdapter()
      await getInstrument(adapter, 'AAPL')
      const result = await getInstrument(adapter, 'AAPL')
      expect(adapter.resolveInstrument).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockDef)
    })

    test('cache key is case-insensitive', async () => {
      const adapter = makeAdapter()
      await getInstrument(adapter, 'aapl')
      const result = await getInstrument(adapter, 'AAPL')
      expect(adapter.resolveInstrument).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockDef)
    })

    test('refetches after TTL expires', async () => {
      const adapter = makeAdapter()
      await getInstrument(adapter, 'AAPL', 0) // TTL = 0ms → immediately expired
      // The entry was set with expiresAt = Date.now() + 0, so next call at same ms might hit cache;
      // but with TTL=0 the next call should refetch since expiresAt <= Date.now()
      const result = await getInstrument(adapter, 'AAPL', 0)
      expect(adapter.resolveInstrument).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockDef)
    })

    test('writes to localStorage', async () => {
      const adapter = makeAdapter()
      await getInstrument(adapter, 'AAPL')
      expect(localStorageMock.setItem).toHaveBeenCalled()
      const args = localStorageMock.setItem.mock.calls[0]
      expect(args[0]).toBe(CACHE_KEY)
      const parsed = JSON.parse(args[1])
      expect(parsed['AAPL']).toBeDefined()
      expect(parsed['AAPL'].value).toEqual(mockDef)
    })
  })

  describe('invalidateInstrument', () => {
    test('removes symbol from cache', async () => {
      const adapter = makeAdapter()
      await getInstrument(adapter, 'AAPL')
      invalidateInstrument('AAPL')
      // Next call should refetch
      await getInstrument(adapter, 'AAPL')
      expect(adapter.resolveInstrument).toHaveBeenCalledTimes(2)
    })

    test('invalidation is case-insensitive', async () => {
      const adapter = makeAdapter()
      await getInstrument(adapter, 'AAPL')
      invalidateInstrument('aapl')
      await getInstrument(adapter, 'AAPL')
      expect(adapter.resolveInstrument).toHaveBeenCalledTimes(2)
    })

    test('does not throw when invalidating non-existent symbol', () => {
      expect(() => invalidateInstrument('NONEXIST')).not.toThrow()
    })
  })
})
