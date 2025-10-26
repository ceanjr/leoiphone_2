# 🛠️ Guia de Desenvolvimento - Léo iPhone

> Guia completo de como desenvolver novas funcionalidades seguindo os padrões do projeto

## 📋 Índice

- [Antes de Começar](#antes-de-começar)
- [Padrões de Código](#padrões-de-código)
- [Fluxos Comuns](#fluxos-comuns)
- [Como Adicionar Features](#como-adicionar-features)
- [Troubleshooting](#troubleshooting)
- [Boas Práticas](#boas-práticas)

---

## 🎯 Antes de Começar

### Leitura Obrigatória

Antes de escrever qualquer código, leia:

1. ✅ `README.md` - Visão geral do projeto
2. ✅ `docs/ARCHITECTURE.md` - Arquitetura do sistema
3. ✅ `docs/FILE-MAP.md` - O que cada arquivo faz
4. ✅ `docs/DATABASE.md` - Estrutura do banco
5. ✅ Este arquivo - Guia de desenvolvimento

### Setup do Ambiente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Rodar servidor
npm run dev
```

---

## 📝 Padrões de Código

### 1. Nomenclatura

#### Arquivos e Pastas
```
✅ Correto:
- produtos-table.tsx (componentes: kebab-case)
- produto.ts (arquivos: kebab-case)
- [id]/page.tsx (dynamic routes: [param])

❌ Incorreto:
- ProdutosTable.tsx
- Produto.ts
- id/page.tsx
```

#### Componentes e Funções
```typescript
✅ Correto:
// Componentes: PascalCase
export function ProdutoCard({ produto }: Props) {}

// Funções: camelCase
export async function createProduto(data: ProdutoFormData) {}

// Constantes: UPPER_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024

❌ Incorreto:
export function produto_card() {}
export function CreateProduto() {}
const maxFileSize = 5000000
```

### 2. Estrutura de Componentes

```typescript
'use client'  // Se necessário

// ===== 1. IMPORTS =====
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Produto } from '@/types/produto'

// ===== 2. TYPES =====
interface ProdutoCardProps {
  produto: Produto
  onDelete?: (id: string) => void
}

// ===== 3. COMPONENT =====
export function ProdutoCard({ produto, onDelete }: ProdutoCardProps) {
  // ===== 4. STATE =====
  const [loading, setLoading] = useState(false)

  // ===== 5. HANDLERS =====
  async function handleDelete() {
    setLoading(true)
    try {
      await onDelete?.(produto.id)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // ===== 6. RENDER =====
  return (
    <div className="card">
      <h3>{produto.nome}</h3>
      <Button onClick={handleDelete} disabled={loading}>
        {loading ? 'Deletando...' : 'Deletar'}
      </Button>
    </div>
  )
}
```

### 3. Server vs Client Components

#### Quando usar Server Component (padrão)

```typescript
// ✅ Server Component (sem 'use client')
export default async function ProdutosPage() {
  // Queries diretas no servidor
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')

  // Renderização no servidor (SSR)
  return <ProdutosList produtos={produtos} />
}
```

**Use quando**:
- Fazer queries no banco
- Não precisa de interatividade
- Buscar dados do servidor
- SEO é importante

#### Quando usar Client Component

```typescript
// ✅ Client Component (com 'use client')
'use client'

export function ProdutoForm() {
  const [data, setData] = useState({})

  return (
    <form onSubmit={handleSubmit}>
      <Input onChange={e => setData(...)} />
    </form>
  )
}
```

**Use quando**:
- Precisa de useState, useEffect, hooks
- Precisa de event handlers (onClick, onChange)
- Precisa de browser APIs
- Componentes interativos (forms, modals)

### 4. Server Actions

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduto(formData: ProdutoFormData) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autorizado' }
  }

  // 2. Validation
  if (!formData.nome || !formData.preco) {
    return { success: false, error: 'Campos obrigatórios faltando' }
  }

  // 3. Database operation
  const { data, error } = await supabase
    .from('produtos')
    .insert({
      nome: formData.nome,
      preco: formData.preco,
      // ...
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 4. Revalidate and redirect
  revalidatePath('/admin/produtos')
  redirect('/admin/produtos')
}
```

**Padrão**:
1. Verificar autenticação
2. Validar dados
3. Executar operação
4. Revalidar cache
5. Retornar resultado ou redirecionar

### 5. Tratamento de Erros

```typescript
// ✅ Correto: Try-catch + toast
try {
  const result = await createProduto(data)

  if (result.error) {
    toast.error(result.error)
    return
  }

  toast.success('Produto criado!')
  router.push('/admin/produtos')
} catch (error) {
  console.error('Erro crítico:', error)
  toast.error('Erro inesperado. Tente novamente.')
}

// ❌ Incorreto: Sem tratamento
const result = await createProduto(data)
router.push('/admin/produtos')
```

---

## 🔄 Fluxos Comuns

### Fluxo 1: Adicionar uma Nova Página Admin

```typescript
// 1. Criar arquivo: app/admin/nova-pagina/page.tsx
export default async function NovaPaginaPage() {
  return (
    <div>
      <Header title="Nova Página" description="Descrição" />
      {/* Conteúdo */}
    </div>
  )
}

// 2. Adicionar no Sidebar: components/admin/sidebar.tsx
const links = [
  // ... links existentes
  {
    href: '/admin/nova-pagina',
    label: 'Nova Página',
    icon: IconeComponent
  }
]

// 3. Atualizar docs/FILE-MAP.md
```

### Fluxo 2: Criar um CRUD Completo

#### Passo 1: Banco de Dados

```sql
-- 1. Criar tabela
CREATE TABLE nova_entidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX idx_nova_entidade_nome ON nova_entidade(nome);

-- 3. Habilitar RLS
ALTER TABLE nova_entidade ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas
CREATE POLICY "Público pode ler" ON nova_entidade
  FOR SELECT USING (true);

CREATE POLICY "Admin pode tudo" ON nova_entidade
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

#### Passo 2: Tipos TypeScript

```typescript
// types/nova-entidade.ts
export interface NovaEntidade {
  id: string
  nome: string
  created_at: string
  updated_at: string
}

export interface NovaEntidadeFormData {
  nome: string
}
```

#### Passo 3: Server Actions

```typescript
// app/admin/nova-entidade/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNovasEntidades() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nova_entidade')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createNovaEntidade(formData: NovaEntidadeFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data, error } = await supabase
    .from('nova_entidade')
    .insert(formData)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/nova-entidade')
  return { success: true, data }
}

// updateNovaEntidade, deleteNovaEntidade...
```

#### Passo 4: Páginas

```typescript
// app/admin/nova-entidade/page.tsx
import { Header } from '@/components/admin/header'
import { getNovasEntidades } from './actions'

export default async function NovaEntidadePage() {
  const { data: entidades } = await getNovasEntidades()

  return (
    <div>
      <Header title="Nova Entidade" description="Gerenciar entidades" />
      {/* Listagem */}
    </div>
  )
}

// app/admin/nova-entidade/novo/page.tsx
'use client'

export default function NovoPage() {
  // Formulário de criação
}

// app/admin/nova-entidade/[id]/page.tsx
'use client'

export default function EditarPage({ params }) {
  // Formulário de edição
}
```

### Fluxo 3: Adicionar Upload de Arquivos

```typescript
// 1. Criar bucket no Supabase (via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('novo-bucket', 'novo-bucket', true);

// 2. Criar API route
// app/api/upload-novo/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  // Upload para storage
  const { data, error } = await supabase.storage
    .from('novo-bucket')
    .upload(`path/${file.name}`, file)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('novo-bucket')
    .getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl })
}

// 3. Componente de upload (pode reusar ImageUpload ou criar novo)
```

### Fluxo 4: Adicionar Filtros/Busca

```typescript
// 1. State para filtros
const [filtros, setFiltros] = useState({
  busca: '',
  categoria: '',
  ordenacao: 'created_at'
})

// 2. Server Action com filtros
export async function getProdutosFiltrados(filtros) {
  let query = supabase
    .from('produtos')
    .select('*')

  if (filtros.busca) {
    query = query.ilike('nome', `%${filtros.busca}%`)
  }

  if (filtros.categoria) {
    query = query.eq('categoria_id', filtros.categoria)
  }

  query = query.order(filtros.ordenacao, { ascending: false })

  return await query
}

// 3. UI dos filtros
<Input
  placeholder="Buscar..."
  onChange={e => setFiltros({ ...filtros, busca: e.target.value })}
/>
```

---

## ✨ Como Adicionar Features

### Feature: Nova Seção na Home

**Objetivo**: Adicionar seção "Mais Vendidos" na home

1. **Banco de Dados**:
```sql
-- Adicionar novo tipo em secoes_home
ALTER TABLE secoes_home DROP CONSTRAINT secoes_home_tipo_check;
ALTER TABLE secoes_home ADD CONSTRAINT secoes_home_tipo_check
  CHECK (tipo IN ('destaques', 'promocoes', 'lancamentos', 'mais_vendidos'));

-- Inserir seção
INSERT INTO secoes_home (tipo, titulo, subtitulo, ordem)
VALUES ('mais_vendidos', 'Mais Vendidos', 'Os produtos favoritos dos clientes', 4);
```

2. **Tipos**:
```typescript
// types/secao.ts
export type TipoSecao = 'destaques' | 'promocoes' | 'lancamentos' | 'mais_vendidos'
```

3. **Página**:
```typescript
// app/(public)/page.tsx
const secaoConfig = {
  // ... configs existentes
  mais_vendidos: {
    icon: '🔥',
    borderColor: 'var(--brand-orange)',
    badge: 'Mais Vendido',
    badgeColor: 'bg-orange-500/20 text-orange-400'
  }
}
```

4. **Documentação**:
- Atualizar `docs/FILE-MAP.md`
- Atualizar `docs/DATABASE.md`

### Feature: Sistema de Avaliações

**Objetivo**: Implementar CRUD de avaliações

1. **Banco** (já existe, só precisa implementar):
```typescript
// app/admin/avaliacoes/actions.ts
'use server'

export async function getAvaliacoes() {
  const supabase = await createClient()
  return await supabase
    .from('avaliacoes')
    .select(`
      *,
      produto:produtos(nome, foto_principal)
    `)
    .order('created_at', { ascending: false })
}

export async function aprovarAvaliacao(id: string) {
  const supabase = await createClient()
  return await supabase
    .from('avaliacoes')
    .update({ aprovado: true })
    .eq('id', id)
}
```

2. **Página**:
```typescript
// app/admin/avaliacoes/page.tsx
export default async function AvaliacoesPage() {
  const { data: avaliacoes } = await getAvaliacoes()

  return (
    <div>
      <Header title="Avaliações" />
      <AvaliacoesTable avaliacoes={avaliacoes} />
    </div>
  )
}
```

3. **Componentes**:
```typescript
// components/admin/avaliacoes-table.tsx
export function AvaliacoesTable({ avaliacoes }) {
  // Tabela com ações: Aprovar, Reprovar, Destacar
}
```

---

## 🐛 Troubleshooting

### Problema: "Não autorizado" no Server Action

**Causa**: Usuário não autenticado ou sessão expirada

**Solução**:
```typescript
// Verificar se está autenticado
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// Se null, fazer login novamente
```

### Problema: RLS bloqueando query

**Causa**: Política RLS muito restritiva

**Solução**:
```sql
-- Ver políticas da tabela
SELECT * FROM pg_policies WHERE tablename = 'nome_tabela';

-- Desabilitar RLS temporariamente (APENAS EM DEV!)
ALTER TABLE nome_tabela DISABLE ROW LEVEL SECURITY;

-- Criar política mais permissiva
CREATE POLICY "Admin pode tudo" ON nome_tabela
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

### Problema: Imagem não carrega

**Causa**: Domínio não configurado no `next.config.ts`

**Solução**:
```typescript
// next.config.ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'seu-dominio.com',
      pathname: '/path/**'
    }
  ]
}
```

### Problema: "params is Promise" error

**Causa**: Next.js 15+ mudou params para Promise

**Solução**:
```typescript
// ✅ Server Component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}

// ✅ Client Component
'use client'
import { use } from 'react'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // ...
}
```

### Problema: Queries lentas

**Causa**: Falta de índices ou queries sequenciais

**Solução**:
```typescript
// ❌ Queries sequenciais
const produtos = await supabase.from('produtos').select('*')
const categorias = await supabase.from('categorias').select('*')

// ✅ Queries em paralelo
const [produtosResult, categoriasResult] = await Promise.all([
  supabase.from('produtos').select('*'),
  supabase.from('categorias').select('*')
])
```

---

## ✅ Boas Práticas

### 1. Performance

```typescript
// ✅ Usar Server Components quando possível
export default async function Page() {
  const data = await fetchData()  // SSR
  return <UI data={data} />
}

// ✅ Queries em paralelo
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()])

// ✅ Revalidação após mutações
revalidatePath('/admin/produtos')

// ✅ Otimizar imagens
<Image
  src={url}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
/>
```

### 2. Segurança

```typescript
// ✅ Sempre validar auth em Server Actions
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Não autorizado' }

// ✅ Validar dados no servidor
if (!formData.nome || !formData.preco) {
  return { error: 'Dados inválidos' }
}

// ✅ Usar RLS no banco
ALTER TABLE tabela ENABLE ROW LEVEL SECURITY;
```

### 3. Type Safety

```typescript
// ✅ Tipar tudo
interface Props {
  produto: Produto
  onDelete: (id: string) => Promise<void>
}

// ✅ Usar tipos do Supabase
import type { Database } from '@/types/database'

// ✅ Tipar respostas de actions
export async function createProduto(): Promise<{ success: boolean; error?: string; data?: Produto }> {
  // ...
}
```

### 4. Organização

```
// ✅ Um componente por arquivo
// ✅ Agrupar arquivos relacionados
// ✅ Nomes descritivos
// ✅ Comentários quando necessário
```

---

## 📝 Checklist de Nova Feature

Antes de considerar uma feature completa:

- [ ] Código implementado e funcional
- [ ] Tipos TypeScript adicionados/atualizados
- [ ] Banco de dados atualizado (schema, RLS, índices)
- [ ] Autenticação verificada onde necessário
- [ ] Tratamento de erros implementado
- [ ] Validações client e server-side
- [ ] Testado localmente
- [ ] Performance otimizada (queries paralelas, índices)
- [ ] Responsivo (mobile-first)
- [ ] Acessibilidade (ARIA labels, keyboard navigation)
- [ ] **docs/FILE-MAP.md atualizado**
- [ ] **docs/DATABASE.md atualizado** (se alterou banco)
- [ ] **docs/DEVELOPMENT-GUIDE.md atualizado** (se novo padrão)
- [ ] **docs/ARCHITECTURE.md atualizado** (se mudança arquitetural)
- [ ] Commit com mensagem descritiva

---

**🚀 Agora você está pronto para desenvolver no projeto!**

**📖 Dúvidas?** Consulte os outros documentos em `docs/` ou peça ajuda!

**📅 Última atualização**: 2025-01-25
