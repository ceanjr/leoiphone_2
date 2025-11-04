'use client'

import { useState, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Smartphone, HardDrive, Star, Wrench, Send } from 'lucide-react'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  trocaSchema,
  type TrocaFormData,
  estadoConservacaoLabels,
  armazenamentoOptions,
} from '@/lib/validations/troca'

interface TrocaModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TrocaFormData) => void
  produtoNome: string
}

function TrocaModalComponent({ open, onClose, onSubmit, produtoNome }: TrocaModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<TrocaFormData>({
    resolver: zodResolver(trocaSchema),
    mode: 'onChange',
    defaultValues: {
      pecasTrocadas: false,
    },
  })

  const pecasTrocadas = watch('pecasTrocadas')
  const armazenamento = watch('armazenamento')
  const estadoConservacao = watch('estadoConservacao')

  function onFormSubmit(data: TrocaFormData) {
    onSubmit(data)
    onClose()
  }

  return (
    <BottomSheet open={open} onOpenChange={onClose}>
      <BottomSheetContent className="flex max-h-[90vh] flex-col overflow-hidden bg-zinc-950 max-sm:h-[90vh] sm:max-w-2xl">
        <div className="flex flex-shrink-0 flex-col gap-1 bg-zinc-950 px-4 pt-2 pb-3 sm:px-6 sm:pt-6">
          <BottomSheetTitle>Avaliação do Seu Aparelho</BottomSheetTitle>
          <BottomSheetDescription>
            Para acelerar seu atendimento, preencha as informações para trocar por {produtoNome}
          </BottomSheetDescription>
        </div>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950"
        >
          <div
            className="flex-1 space-y-5 overflow-y-auto bg-zinc-950 px-4 pt-2 pb-6 sm:px-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#3f3f46 transparent',
            }}
          >
            {/* Modelo */}
            <div className="space-y-2">
              <Label htmlFor="modelo" className="flex items-center gap-2 text-white">
                <Smartphone className="h-4 w-4 text-yellow-500" />
                Modelo do Aparelho
              </Label>
              <Input
                id="modelo"
                placeholder="Ex: iPhone 12 Pro"
                {...register('modelo')}
                className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500"
              />
              {errors.modelo && <p className="text-sm text-red-500">{errors.modelo.message}</p>}
            </div>

            {/* Armazenamento */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-white">
                <HardDrive className="h-4 w-4 text-yellow-500" />
                Armazenamento
              </Label>
              <RadioGroup
                value={armazenamento}
                onValueChange={(value) =>
                  setValue('armazenamento', value as any, {
                    shouldValidate: true,
                  })
                }
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              >
                {armazenamentoOptions.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-2.5 transition-all sm:p-3 ${
                      armazenamento === option
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <RadioGroupItem value={option} className="sr-only" />
                    <span
                      className={`text-xs font-medium sm:text-sm ${
                        armazenamento === option ? 'text-yellow-500' : 'text-white'
                      }`}
                    >
                      {option}
                    </span>
                  </label>
                ))}
              </RadioGroup>
              {errors.armazenamento && (
                <p className="text-sm text-red-500">{errors.armazenamento.message}</p>
              )}
            </div>

            {/* Estado de Conservação */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-white">
                <Star className="h-4 w-4 text-yellow-500" />
                Estado de Conservação
              </Label>
              <RadioGroup
                value={estadoConservacao}
                onValueChange={(value) =>
                  setValue('estadoConservacao', value as any, {
                    shouldValidate: true,
                  })
                }
                className="space-y-2"
              >
                {Object.entries(estadoConservacaoLabels).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all sm:p-4 ${
                      estadoConservacao === value
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        estadoConservacao === value ? 'border-yellow-500' : 'border-zinc-700'
                      }`}
                    >
                      {estadoConservacao === value && (
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-xs font-medium sm:text-sm ${
                        estadoConservacao === value ? 'text-yellow-500' : 'text-white'
                      }`}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </RadioGroup>
              {errors.estadoConservacao && (
                <p className="text-sm text-red-500">{errors.estadoConservacao.message}</p>
              )}
            </div>

            {/* Peças Trocadas */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-white">
                <Wrench className="h-4 w-4 text-yellow-500" />
                Possui Peças Trocadas?
              </Label>
              <RadioGroup
                value={pecasTrocadas ? 'sim' : 'nao'}
                onValueChange={(value) =>
                  setValue('pecasTrocadas', value === 'sim', {
                    shouldValidate: true,
                  })
                }
                className="grid grid-cols-2 gap-2"
              >
                <label
                  className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 transition-all ${
                    pecasTrocadas === false
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <RadioGroupItem value="nao" className="sr-only" />
                  <span
                    className={`text-sm font-medium ${
                      pecasTrocadas === false ? 'text-yellow-500' : 'text-white'
                    }`}
                  >
                    Não
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 transition-all ${
                    pecasTrocadas === true
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <RadioGroupItem value="sim" className="sr-only" />
                  <span
                    className={`text-sm font-medium ${
                      pecasTrocadas === true ? 'text-yellow-500' : 'text-white'
                    }`}
                  >
                    Sim
                  </span>
                </label>
              </RadioGroup>

              {pecasTrocadas && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Descreva quais peças foram trocadas (bateria, tela, etc.)"
                    {...register('descricaoPecas')}
                    className="min-h-[100px] resize-none border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500"
                  />
                  {errors.descricaoPecas && (
                    <p className="text-sm text-red-500">{errors.descricaoPecas.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Informação sobre fotos */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 sm:p-4">
              <p className="text-xs text-blue-400 sm:text-sm">
                📸 Após enviar, lembre-se de enviar fotos do seu aparelho pelo WhatsApp para uma
                avaliação mais precisa!
              </p>
            </div>
          </div>

          {/* Botões - Fixed at bottom */}
          <div className="flex flex-shrink-0 gap-2 border-t border-zinc-800 bg-zinc-950 px-4 py-3 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] flex-1 text-(--color-error) hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
              className="min-h-[44px] flex-1 gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Enviar para WhatsApp
            </Button>
          </div>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  )
}

// Memoize para lazy loading eficiente
export const TrocaModal = memo(TrocaModalComponent)
