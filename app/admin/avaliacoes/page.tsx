import { Header } from '@/components/admin/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

export default function AvaliacoesPage() {
  return (
    <div className="flex flex-col">
      <Header title="Avaliações" description="Gerencie as avaliações de clientes" />

      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Avaliações Pendentes</h2>
          <div className="flex gap-2">
            <Button variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar Selecionadas
            </Button>
            <Button variant="outline">
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar Selecionadas
            </Button>
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-white">Em desenvolvimento</CardTitle>
            <CardDescription className="text-zinc-400">
              Esta página está sendo desenvolvida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400">
              A funcionalidade de gerenciamento de avaliações estará disponível em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
