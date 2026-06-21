import type { Quote } from '../models'

export function spread(q: Quote) {
  return +(q.ask - q.bid).toFixed(4)
}

export function midPrice(q: Quote) {
  return +((q.bid + q.ask) / 2).toFixed(4)
}
