import type { JournalEntry } from '../models'

/** Create a properly-typed JournalEntry payload */
export function createJournalEntry(id: string, notes: string): JournalEntry {
  return { id, notes, timestamp: new Date().toISOString() }
}
