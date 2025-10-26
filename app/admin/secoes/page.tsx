'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SecoesPage() {
  const [secoes, setSecoes] = useState({
    banner: true,
    destaque: true,
    categorias: true,
    novidades: true,
  })

  function toggleSecao(secao: keyof typeof secoes) {
    setSecoes(prev => ({
      ...prev,
      [secao]: !prev[secao]
    }))
    toast.success('Configuração atualizada!')
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <h2 className="text-xl font-bold text-white md:text-2xl">Seções da Home</h2>
        <p className="text-xs text-zinc-400 md:text-sm">
          Controle quais seções aparecem na página inicial
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Banner Carrossel</CardTitle>
            <CardDescription>Exibir carrossel de banners no topo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="banner"
                checked={secoes.banner}
                onCheckedChange={() => toggleSecao('banner')}
              />
              <Label htmlFor="banner" className="cursor-pointer">
                {secoes.banner ? 'Ativado' : 'Desativado'}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Produtos em Destaque</CardTitle>
            <CardDescription>Mostrar seção de produtos destacados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="destaque"
                checked={secoes.destaque}
                onCheckedChange={() => toggleSecao('destaque')}
              />
              <Label htmlFor="destaque" className="cursor-pointer">
                {secoes.destaque ? 'Ativado' : 'Desativado'}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Categorias</CardTitle>
            <CardDescription>Exibir produtos agrupados por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="categorias"
                checked={secoes.categorias}
                onCheckedChange={() => toggleSecao('categorias')}
              />
              <Label htmlFor="categorias" className="cursor-pointer">
                {secoes.categorias ? 'Ativado' : 'Desativado'}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Novidades</CardTitle>
            <CardDescription>Mostrar produtos adicionados recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="novidades"
                checked={secoes.novidades}
                onCheckedChange={() => toggleSecao('novidades')}
              />
              <Label htmlFor="novidades" className="cursor-pointer">
                {secoes.novidades ? 'Ativado' : 'Desativado'}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400">
          <p>As alterações são aplicadas imediatamente na página inicial do site.</p>
          <p className="mt-2">
            Desative seções que não deseja exibir temporariamente sem precisar excluir o conteúdo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
