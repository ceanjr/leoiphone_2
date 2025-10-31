'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { ProdutoCusto } from '@/types/produto'

interface CustosTableDialogProps {
  custos: ProdutoCusto[]
}

export function CustosTableDialog({ custos }: CustosTableDialogProps) {
  if (!custos || custos.length === 0) {
    return null
  }

  // Se tem apenas 1 custo, exibir diretamente (sem dialog)
  if (custos.length === 1) {
    return (
      <div className="text-xs leading-none text-zinc-400">
        Custo: R$ {custos[0].custo.toFixed(2)}
      </div>
    )
  }

  // Calcular totais
  const estoqueTotal = custos.reduce((sum, c) => sum + c.estoque, 0)
  const custoMedio = custos.reduce((sum, c) => sum + c.custo * c.estoque, 0) / estoqueTotal

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="m-0 inline-flex h-auto min-h-0 items-center justify-center p-0 align-middle text-xs leading-none font-normal text-zinc-400 transition-none"
        >
          Tabela de Custos →
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md px-4 pt-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle>Custos e Estoque</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                {custos.some((c) => c.codigo) && (
                  <TableHead className="text-right">Código</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {custos.map((custo) => (
                <TableRow key={custo.id}>
                  <TableCell className="font-medium">{custo.estoque} un.</TableCell>
                  <TableCell className="text-right">R$ {custo.custo.toFixed(2)}</TableCell>
                  {custos.some((c) => c.codigo) && (
                    <TableCell className="text-muted-foreground text-right text-xs">
                      {custo.codigo || '-'}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Total em estoque:</span>
              <span>{estoqueTotal} unidades</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Custo médio:</span>
              <span>R$ {custoMedio.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
