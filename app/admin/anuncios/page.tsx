import { Metadata } from 'next'
import { AnunciosManager } from '@/components/admin/anuncios/anuncios-manager'
import { OlxManager } from '@/components/admin/anuncios/olx-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Anúncios | Admin',
  description: 'Gerenciar anúncios no Facebook Marketplace e OLX',
}

export default function AnunciosPage() {
  return (
    <div className="container mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Anúncios</h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:mt-2 sm:text-base">
            Gerencie seus anúncios no Facebook Marketplace e OLX
          </p>
        </div>
      </div>

      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
          <TabsTrigger 
            value="facebook"
            className="h-auto flex-col gap-1 rounded-lg border-2 border-transparent bg-zinc-900/50 px-3 py-3 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-500/10 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 sm:px-4 sm:py-3"
          >
            <span className="text-xs font-semibold sm:text-sm">Facebook</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">Marketplace</span>
          </TabsTrigger>
          <TabsTrigger 
            value="olx"
            className="h-auto flex-col gap-1 rounded-lg border-2 border-transparent bg-zinc-900/50 px-3 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-purple-500/10 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 sm:px-4 sm:py-3"
          >
            <span className="text-xs font-semibold sm:text-sm">OLX</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">Classificados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facebook" className="mt-4 sm:mt-6">
          <AnunciosManager />
        </TabsContent>

        <TabsContent value="olx" className="mt-4 sm:mt-6">
          <OlxManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
