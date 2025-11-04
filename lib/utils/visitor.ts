/**
 * Sistema centralizado de visitor_id
 * Usa cookies para consistência com o tracking existente
 */

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''

  // Tentar pegar do cookie primeiro
  const cookieVisitorId = getCookie('visitor_id')
  if (cookieVisitorId) return cookieVisitorId

  // Se não existir, criar novo
  const newVisitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  
  // Salvar no cookie (expira em 1 ano)
  setCookie('visitor_id', newVisitorId, 365)
  
  return newVisitorId
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`
}