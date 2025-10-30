/**
 * Script para limpar e desregistrar service workers
 * Execute este script quando tiver problemas com cache em desenvolvimento
 *
 * Uso: Adicione no navegador console ou crie um botão para executar
 */

(async function cleanupServiceWorkers() {
  if (!navigator.serviceWorker) {
    console.log('❌ Service Workers não são suportados neste navegador')
    return
  }

  try {
    console.log('🧹 Iniciando limpeza de Service Workers...')

    // 1. Desregistrar todos os service workers
    const registrations = await navigator.serviceWorker.getRegistrations()

    if (registrations.length === 0) {
      console.log('✅ Nenhum service worker registrado')
    } else {
      console.log(`📋 Encontrados ${registrations.length} service worker(s)`)

      for (const registration of registrations) {
        await registration.unregister()
        console.log('✅ Service worker desregistrado:', registration.scope)
      }
    }

    // 2. Limpar todos os caches
    const cacheNames = await caches.keys()

    if (cacheNames.length === 0) {
      console.log('✅ Nenhum cache encontrado')
    } else {
      console.log(`📦 Encontrados ${cacheNames.length} cache(s)`)

      for (const cacheName of cacheNames) {
        await caches.delete(cacheName)
        console.log('✅ Cache removido:', cacheName)
      }
    }

    console.log('🎉 Limpeza concluída! Recarregue a página.')

    // Recarregar a página após 1 segundo
    setTimeout(() => {
      window.location.reload()
    }, 1000)

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error)
  }
})()
