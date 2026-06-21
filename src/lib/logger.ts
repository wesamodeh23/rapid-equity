const prefix = (module?: string) => (module ? `[${module}]` : '[app]')

export default {
  info(module: string, ...args: any[]) {
    // eslint-disable-next-line no-console
    console.info(prefix(module), ...args)
  },
  warn(module: string, ...args: any[]) {
    // eslint-disable-next-line no-console
    console.warn(prefix(module), ...args)
  },
  error(module: string, ...args: any[]) {
    // eslint-disable-next-line no-console
    console.error(prefix(module), ...args)
  }
}
