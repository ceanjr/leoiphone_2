/**
 * Rate limiter simples baseado em IP
 * Usado para proteger APIs públicas de abuso
 */

interface RateLimitConfig {
  interval: number // janela de tempo em ms
  maxRequests: number // máximo de requisições na janela
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

const cache = new Map<string, RateLimitEntry>()

/**
 * Verifica se uma requisição deve ser permitida
 * @param identifier - Identificador único (IP, user ID, etc)
 * @param config - Configuração do rate limit
 * @returns true se permitido, false se bloqueado
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = cache.get(identifier)

  // Limpar entrada se expirou
  if (entry && now > entry.resetTime) {
    cache.delete(identifier)
  }

  const current = cache.get(identifier)

  if (!current) {
    // Primeira requisição
    cache.set(identifier, {
      count: 1,
      resetTime: now + config.interval,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.interval,
    }
  }

  if (current.count >= config.maxRequests) {
    // Limite excedido
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  // Incrementar contador
  current.count++
  cache.set(identifier, current)

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

/**
 * Extrai IP da requisição Next.js
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

/**
 * Limpar cache periodicamente (chamado por cleanup job)
 */
export function cleanupRateLimitCache(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now > entry.resetTime) {
      cache.delete(key)
    }
  }
}

// Cleanup automático a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitCache, 5 * 60 * 1000)
}
