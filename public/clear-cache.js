/**
 * Script para limpar cache do Service Worker e forçar atualização
 * Execute este arquivo no console do navegador ou adicione como snippet
 */

// 1. Desregistrar todos os service workers
async function unregisterServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  console.log(`🔍 Encontrados ${registrations.length} service workers`)
  
  for (let registration of registrations) {
    await registration.unregister()
    console.log('✅ Service worker desregistrado:', registration.scope)
  }
}

// 2. Limpar todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  console.log(`🗑️  Limpando ${cacheNames.length} caches`)
  
  for (let cacheName of cacheNames) {
    await caches.delete(cacheName)
    console.log('✅ Cache removido:', cacheName)
  }
}

// 3. Limpar storage
function clearStorage() {
  localStorage.clear()
  sessionStorage.clear()
  console.log('✅ LocalStorage e SessionStorage limpos')
}

// 4. Executar limpeza completa
async function clearAll() {
  console.log('🚀 Iniciando limpeza completa...')
  
  try {
    await unregisterServiceWorkers()
    await clearAllCaches()
    clearStorage()
    
    console.log('✨ Limpeza completa! Recarregando página...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error)
  }
}

// Executar
clearAll()
