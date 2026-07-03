import { describe, test, expect, vi } from 'vitest'
import Logger from '../logger'

describe('Logger', () => {
  test('info logs with module prefix', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    Logger.info('TestModule', 'hello', 123)
    expect(spy).toHaveBeenCalledWith('[TestModule]', 'hello', 123)
    spy.mockRestore()
  })

  test('warn logs with module prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    Logger.warn('TestModule', 'warning msg')
    expect(spy).toHaveBeenCalledWith('[TestModule]', 'warning msg')
    spy.mockRestore()
  })

  test('error logs with module prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    Logger.error('TestModule', 'error msg')
    expect(spy).toHaveBeenCalledWith('[TestModule]', 'error msg')
    spy.mockRestore()
  })

  test('info logs with [app] prefix when module is empty', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    Logger.info('', 'fallback')
    expect(spy).toHaveBeenCalledWith('[app]', 'fallback')
    spy.mockRestore()
  })
})
