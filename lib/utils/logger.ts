/**
 * Logger condicional que só loga em desenvolvimento
 * Previne vazamento de informações sensíveis em produção
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

interface Logger {
  log: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  debug: (...args: any[]) => void
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Logger que só funciona em desenvolvimento
 * Em produção, apenas errors são logados
 */
export const logger: Logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    // Errors sempre são logados, mesmo em produção
    console.error(...args)
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
}

/**
 * Logger formatado com prefixo
 */
export function createLogger(prefix: string): Logger {
  return {
    log: (...args: any[]) => logger.log(`[${prefix}]`, ...args),
    info: (...args: any[]) => logger.info(`[${prefix}]`, ...args),
    warn: (...args: any[]) => logger.warn(`[${prefix}]`, ...args),
    error: (...args: any[]) => logger.error(`[${prefix}]`, ...args),
    debug: (...args: any[]) => logger.debug(`[${prefix}]`, ...args),
  }
}
