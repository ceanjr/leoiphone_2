# 📚 Documentação de Componentes

## Estrutura de Pastas

```
components/
├── ui/              # Componentes primitivos do Radix UI
├── shared/          # Componentes compartilhados entre admin e public
├── admin/           # Componentes exclusivos do painel admin
├── public/          # Componentes da interface pública
├── seo/             # Componentes de SEO (structured data)
└── tracking/        # Componentes de analytics e tracking
```

## 🎨 Componentes UI (/ui)

Wrappers padronizados do Radix UI com estilo Tailwind.

**Não modificar** - São componentes base gerados pelo shadcn/ui.

### Principais componentes:
- `button.tsx` - Botão com variantes (default, outline, ghost, etc)
- `dialog.tsx` - Modais e dialogs
- `input.tsx`, `textarea.tsx`, `select.tsx` - Form inputs
- `card.tsx` - Container com header/content/footer
- `table.tsx` - Tabelas responsivas
- `badge.tsx` - Tags e badges
- `alert.tsx` - Alertas e notificações

## 🔄 Componentes Compartilhados (/shared)

Componentes reutilizados em admin e public.

### battery-icon.tsx
**Uso**: Ícone de bateria com níveis visuais  
**Props**:
- `level: number` - Nível da bateria (0-100)
- `className?: string`

**Exemplo**:
```tsx
<BatteryIcon level={85} />
```

### color-badge.tsx
**Uso**: Badge de cor com nome e visual  
**Props**:
- `color: string` - Nome da cor em português
- `size?: 'sm' | 'md' | 'lg'`

**Exemplo**:
```tsx
<ColorBadge color="Preto Espacial" size="md" />
```

### loading-skeleton.tsx ⭐ NOVO
**Uso**: Skeletons de loading para produtos e listas  
**Componentes**:
- `LoadingSkeleton` - Grid de cards
- `ProductsByCategorySkeleton` - Categorias completas
- `TableSkeleton` - Tabelas admin

**Exemplo**:
```tsx
<LoadingSkeleton count={4} view="grid" />
<ProductsByCategorySkeleton />
<TableSkeleton rows={10} columns={5} />
```

### confirm-dialog.tsx
**Uso**: Dialog de confirmação genérico  
**Props**:
- `open: boolean`
- `title: string`
- `description: string`
- `onConfirm: () => void`
- `onCancel: () => void`

### section-error-boundary.tsx
**Uso**: Error boundary para seções isoladas  
**Props**:
- `children: ReactNode`
- `fallback?: ReactNode`

**Exemplo**:
```tsx
<SectionErrorBoundary fallback={<ErrorMessage />}>
  <ProdutosSection />
</SectionErrorBoundary>
```

### whatsapp-contact-button.tsx
**Uso**: Botão flutuante para contato WhatsApp  
**Props**:
- `phoneNumber: string`
- `message?: string`
- `position?: 'bottom-right' | 'bottom-left'`

## 🏪 Componentes Públicos (/public)

Componentes da interface do usuário final.

### /home (Subpasta)

#### BuscaForm.tsx
**Uso**: Formulário de busca com autocomplete  
**Props**:
- `busca: string`
- `onBuscaChange: (value: string) => void`
- `onBuscaSubmit: (e: FormEvent) => void`
- `onLimpar: () => void`
- `inputRef?: RefObject<HTMLInputElement>`

#### ViewToggle.tsx
**Uso**: Toggle entre visualização grid e lista  
**Props**:
- `viewMode: 'grid' | 'list'`
- `onViewModeChange: (mode: 'grid' | 'list') => void`

#### ProdutosPorCategoria.tsx
**Uso**: Grid de produtos agrupados por categoria  
**Props**:
- `produtosAgrupados: ProdutosAgrupados[]`
- `viewMode: 'grid' | 'list'`
- `returnParams: string`
- `custosPorProduto: Record<string, ProdutoCusto[]>`
- `isAuthenticated: boolean`

#### VerMaisButton.tsx
**Uso**: Botão de paginação "Ver Mais"  
**Props**:
- `onClick: () => void`
- `loading?: boolean`
- `temMaisProdutos: boolean`

### produto-card.tsx
**Uso**: Card de produto (grid ou list)  
**Props**:
- `produto: Produto`
- `view: 'grid' | 'list'`
- `priority?: boolean` - Para imagens above the fold
- `returnParams?: string`
- `custos?: ProdutoCusto[]`
- `isAuthenticated?: boolean`

**Exemplo**:
```tsx
<ProdutoCard
  produto={produto}
  view="grid"
  priority={index < 4}
  returnParams="?categoria=iphone"
/>
```

### banner-carousel.tsx
**Uso**: Carrossel de banners da home  
**Features**:
- Auto-play
- Navegação por dots
- Swipe em mobile
- Lazy loading de imagens

### header.tsx e footer.tsx
**Uso**: Header e footer da página pública  
**Features**:
- Responsivo
- Menu mobile
- Links de navegação

### filters-drawer.tsx
**Uso**: Drawer lateral com filtros avançados  
**Props**:
- `open: boolean`
- `onClose: () => void`
- `filters: ProductFilters`
- `onFiltersChange: (filters: ProductFilters) => void`

### produtos-relacionados.tsx
**Uso**: Grid de produtos relacionados  
**Props**:
- `produtoAtual: Produto`
- `limit?: number`

## 🔧 Componentes Admin (/admin)

Componentes do painel administrativo.

### /anuncios (Subpasta)
- `anuncios-manager.tsx` - Gerenciador principal
- `anuncios-table.tsx` - Tabela de anúncios
- `criar-anuncio-dialog.tsx` - Modal de criação
- `olx-manager.tsx` - Integração OLX

### /produtos (Subpasta)
- `products-manager.tsx` - Gerenciador principal
- `product-form-dialog.tsx` - Formulário de edição
- `custos-manager.tsx` - Gerenciamento de custos
- `export-images-dialog.tsx` - Exportar imagens
- `export-story-dialog.tsx` - Exportar stories

### sidebar.tsx e mobile-nav.tsx
**Uso**: Navegação do admin  
**Features**:
- Menu colapsável
- Links ativos
- Responsivo

### produtos-table.tsx
**Uso**: Tabela completa de produtos  
**Features**:
- Ordenação
- Filtros
- Ações em massa
- Edição inline

## 📊 SEO Components (/seo)

### product-structured-data.tsx
**Uso**: JSON-LD para produtos (Schema.org)  
**Props**:
- `produto: Produto`
- `categoria: Categoria`

**Renderiza**:
- Product schema
- Offer schema
- Breadcrumbs schema

## 📈 Tracking (/tracking)

### page-tracker.tsx
**Uso**: Analytics e page views  
**Features**:
- Tracking automático de páginas
- Eventos customizados
- Privacy-friendly

## 🎯 Hooks Customizados Relacionados

### useHomeData
**Arquivo**: `hooks/use-home-data.ts`  
**Retorna**: Dados da homepage (produtos, categorias, seções)

### useHomeFilters
**Arquivo**: `hooks/use-home-filters.ts`  
**Retorna**: Filtros e sincronização com URL

### useProdutosAgrupados
**Arquivo**: `hooks/use-home-produtos-agrupados.ts`  
**Retorna**: Produtos agrupados e paginação

## 🔍 Convenções de Código

### Nomenclatura
- Componentes: PascalCase (`ProdutoCard.tsx`)
- Hooks: camelCase com prefixo use (`useHomeData.ts`)
- Utils: camelCase (`produto-helpers.ts`)
- Tipos: PascalCase (`type Produto`)

### Props
- Sempre tipar com interface ou type
- Desestruturar na assinatura da função
- Props opcionais com `?`

### Imports
```tsx
// External
import { useState } from 'react'

// UI Components
import { Button } from '@/components/ui/button'

// Internal Components
import { ProdutoCard } from './produto-card'

// Hooks e Utils
import { useAuth } from '@/hooks/use-auth'
import { logger } from '@/lib/utils/logger'

// Types
import type { Produto } from '@/types/produto'
```

### Estilo
- Tailwind CSS para estilos
- CSS variables para cores brand
- Classes utilitárias ao invés de CSS customizado
- Usar `cn()` para classes condicionais

### Performance
- Use `React.memo` para componentes pesados
- Lazy load modais e componentes grandes
- `priority` prop para imagens above the fold
- Virtualization para listas grandes (>100 items)

## 📝 Como Adicionar um Novo Componente

1. **Criar arquivo na pasta correta**
   - `/ui` - Se for wrapper do Radix
   - `/shared` - Se usar em admin e public
   - `/admin` ou `/public` - Se exclusivo

2. **Tipar props**
   ```tsx
   interface MeuComponenteProps {
     titulo: string
     opcional?: boolean
   }
   ```

3. **Exportar componente**
   ```tsx
   export function MeuComponente({ titulo, opcional }: MeuComponenteProps) {
     return <div>{titulo}</div>
   }
   ```

4. **Adicionar a barrel export se houver**
   - `index.ts` na pasta

5. **Documentar**
   - Adicionar comentário JSDoc
   - Atualizar este README

## 🔄 Status dos Componentes

✅ **Estáveis**: ui/, shared/, public/home/  
⚠️ **Em refatoração**: admin/ (console.log sendo removidos)  
💡 **Planejados**: Mais componentes SEO, skeletons customizados  

## 📚 Recursos Adicionais

- [Radix UI Docs](https://www.radix-ui.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última atualização**: 04/11/2025  
**Mantido por**: Time de desenvolvimento
