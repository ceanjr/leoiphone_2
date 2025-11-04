'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if prompt was dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const now = new Date()
      const daysSinceDismissed = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return
      }
    }

    const handler = (e: Event) => {
      e.preventDefault()
      console.log('beforeinstallprompt event fired')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after 3 seconds
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For development/testing - show instructions if no prompt after 5 seconds
    const devTimeout = setTimeout(() => {
      if (!deferredPrompt && process.env.NODE_ENV === 'development') {
        console.log('No beforeinstallprompt event. Showing manual instructions.')
        setShowInstructions(true)
      }
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(devTimeout)
    }
  }, [deferredPrompt])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowInstructions(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  const handleShowInstructions = () => {
    setShowInstructions(true)
  }

  // Manual instructions for browsers that don't support beforeinstallprompt
  if (showInstructions && !isInstalled) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Smartphone className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Como Instalar o App</h3>
              <div className="mt-2 space-y-3 text-sm text-zinc-300">
                <div>
                  <p className="font-medium text-blue-400">📱 Android (Chrome):</p>
                  <p className="mt-1 text-zinc-400">Menu (⋮) → &quot;Instalar app&quot;</p>
                </div>
                <div>
                  <p className="font-medium text-blue-400">🍎 iOS (Safari):</p>
                  <p className="mt-1 text-zinc-400">Compartilhar → &quot;Adicionar à Tela de Início&quot;</p>
                </div>
                <div>
                  <p className="font-medium text-blue-400">💻 Desktop (Chrome/Edge):</p>
                  <p className="mt-1 text-zinc-400">Ícone de + na barra de endereço</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="mt-3"
              >
                Entendi
              </Button>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-zinc-400 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Auto prompt for supported browsers
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Download className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Instalar Leo iPhone</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Instale nosso app para acesso rápido e experiência melhorada
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Instalar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-zinc-400 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Botão manual para mostrar instruções de instalação
export function InstallButton() {
  const [showInstructions, setShowInstructions] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
  }, [])

  if (isInstalled) {
    return (
      <div className="rounded-lg border border-green-900 bg-green-950/20 p-3">
        <p className="text-sm text-green-400">✅ App já instalado</p>
      </div>
    )
  }

  if (showInstructions) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-white">Como Instalar</h3>
          <button
            onClick={() => setShowInstructions(false)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="font-medium text-blue-400">📱 Android (Chrome):</p>
            <p className="mt-1 text-zinc-400">Menu (⋮) → &quot;Instalar app&quot; ou &quot;Adicionar à tela inicial&quot;</p>
          </div>
          <div>
            <p className="font-medium text-blue-400">🍎 iOS (Safari):</p>
            <p className="mt-1 text-zinc-400">Botão Compartilhar → &quot;Adicionar à Tela de Início&quot;</p>
          </div>
          <div>
            <p className="font-medium text-blue-400">💻 Desktop:</p>
            <p className="mt-1 text-zinc-400">Chrome/Edge: Ícone de + na barra de endereço</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowInstructions(true)}
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      <Download className="mr-2 h-4 w-4" />
      Como Instalar o App
    </Button>
  )
}
