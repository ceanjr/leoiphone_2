'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary para capturar erros em componentes específicos
 * Evita que um erro em uma seção quebre toda a aplicação
 */
export class SectionErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Section Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-white">
              Erro ao carregar esta seção
            </h3>
            <p className="text-sm text-zinc-400">
              Ocorreu um erro inesperado. A página continua funcionando normalmente.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-zinc-500">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-zinc-900 p-2 text-xs text-red-400">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook wrapper para facilitar o uso do Error Boundary
 */
export function withSectionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <SectionErrorBoundary fallback={fallback}>
        <Component {...props} />
      </SectionErrorBoundary>
    )
  }
}
