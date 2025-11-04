'use client'

import { ShoppingCart, Repeat, ChevronRight } from 'lucide-react'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'

interface CompraOuTrocaModalProps {
  open: boolean
  onClose: () => void
  onComprar: () => void
  onTrocar: () => void
  produtoNome: string
}

export function CompraOuTrocaModal({
  open,
  onClose,
  onComprar,
  onTrocar,
  produtoNome,
}: CompraOuTrocaModalProps) {
  return (
    <BottomSheet open={open} onOpenChange={onClose}>
      <BottomSheetContent className="flex max-h-[90vh] flex-col overflow-hidden bg-zinc-950 max-sm:h-auto sm:max-w-lg">
        <div className="flex-shrink-0 bg-zinc-950 px-4 pt-2 pb-3 sm:px-6 sm:pt-6">
          <BottomSheetTitle>Como você prefere prosseguir?</BottomSheetTitle>
          <BottomSheetDescription>
            Escolha se deseja comprar ou fazer uma troca
          </BottomSheetDescription>
        </div>

        <div className="flex-1 space-y-3 overflow-hidden bg-zinc-950 px-4 pb-4 sm:px-6">
          {/* Botão Comprar */}
          <button
            onClick={() => {
              onClose()
              onComprar()
            }}
            className="group relative flex min-h-[80px] w-full items-center gap-3 rounded-lg border-2 border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-yellow-500 hover:bg-zinc-900/80 active:scale-[0.98] sm:gap-4 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/10 transition-colors group-hover:bg-yellow-500/20 sm:h-14 sm:w-14">
              <ShoppingCart className="h-6 w-6 text-yellow-500 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-0.5 text-base font-semibold text-white sm:text-lg">Comprar</h3>
              <p className="line-clamp-1 text-xs text-zinc-400 sm:text-sm">
                Adquirir o {produtoNome}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-yellow-500" />
          </button>

          {/* Botão Trocar */}
          <button
            onClick={() => {
              onClose()
              onTrocar()
            }}
            className="group relative flex min-h-[80px] w-full items-center gap-3 rounded-lg border-2 border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-yellow-500 hover:bg-zinc-900/80 active:scale-[0.98] sm:gap-4 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/10 transition-colors group-hover:bg-yellow-500/20 sm:h-14 sm:w-14">
              <Repeat className="h-6 w-6 text-yellow-500 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-0.5 text-base font-semibold text-white sm:text-lg">Trocar</h3>
              <p className="line-clamp-1 text-xs text-zinc-400 sm:text-sm">
                Dar meu aparelho antigo como entrada
              </p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-yellow-500" />
          </button>
        </div>

        {/* Botão Cancelar - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 py-3 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="min-h-[44px] w-full text-(--color-error) hover:bg-zinc-900 hover:text-white"
          >
            Cancelar
          </Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}
