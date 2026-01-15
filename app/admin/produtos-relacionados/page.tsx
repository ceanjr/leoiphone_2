import { Header } from '@/components/admin/header'
import { ProdutosRelacionadosConfig } from '@/components/admin/produtos-relacionados/config'

export const metadata = {
  title: 'Produtos Relacionados - Admin Léo iPhone',
  description: 'Configurar exibição de produtos relacionados',
}

export default function ProdutosRelacionadosPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Produtos Relacionados"
        description="Ative ou desative a exibição de produtos relacionados nas páginas dos produtos"
      />

      <div className="p-4 md:p-6">
        <ProdutosRelacionadosConfig />
      </div>
    </div>
  )
}
