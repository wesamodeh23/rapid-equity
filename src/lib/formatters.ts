/**
 * Shared formatting utilities used across the application.
 */

/** Format an ISO timestamp or Date as a locale date+time string */
export function formatDateTime(input: string | number | Date): string {
  return new Date(input).toLocaleString()
}

/** Format an ISO timestamp or Date as a locale time-only string */
export function formatTime(input: string | number | Date): string {
  return new Date(input).toLocaleTimeString()
}

/** Format a number as USD currency (no cents by default) */
export function formatCurrency(value: number, decimals = 2): string {
  return `$${value.toFixed(decimals)}`
}

/** Compute seconds elapsed since a given ISO timestamp */
export function secondsAgo(isoTime: string): number {
  return Math.round((Date.now() - new Date(isoTime).getTime()) / 1000)
}
