# 🏗️ Arquitetura do Sistema - Léo iPhone

> Documento técnico detalhado da arquitetura do sistema

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura de Camadas](#arquitetura-de-camadas)
- [Fluxo de Dados](#fluxo-de-dados)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Sistema de Rotas](#sistema-de-rotas)
- [Gerenciamento de Estado](#gerenciamento-de-estado)
- [Upload e Storage](#upload-e-storage)
- [Performance e Otimizações](#performance-e-otimizações)

---

## 🎯 Visão Geral

O sistema Léo iPhone é uma aplicação full-stack construída com Next.js 15 (App Router) e Supabase. A arquitetura segue princípios modernos de desenvolvimento web:

- **Server-Side Rendering (SSR)** para SEO e performance
- **Server Components** por padrão (React 19)
- **Client Components** apenas quando necessário
- **API Routes** para operações específicas
- **Row Level Security (RLS)** no banco de dados

### Princípios Arquiteturais

1. **Separation of Concerns**: Separação clara entre público e admin
2. **Security First**: Autenticação e autorização em todas as camadas
3. **Performance**: Otimizações de imagem, cache e queries
4. **Type Safety**: TypeScript em todo o projeto
5. **Scalability**: Estrutura preparada para crescimento

---

## 🚀 Stack Tecnológica

### Frontend

```typescript
// Framework e Biblioteca UI
Next.js 15          // Framework React com App Router
React 19            // Biblioteca de UI (Server Components)
TypeScript 5        // Tipagem estática

// Estilização
Tailwind CSS 3      // Utility-first CSS
shadcn/ui           // Componentes acessíveis
Lucide React        // Sistema de ícones

// Formulários e Validação
React Hook Form     // Gerenciamento de formulários
Zod                 // Schema validation

// UI/UX
Sonner              // Toast notifications
next/image          // Otimização de imagens
```

### Backend

```typescript
// Backend as a Service
Supabase
  ├── PostgreSQL     // Banco de dados relacional
  ├── Auth           // Autenticação JWT
  ├── Storage        // Armazenamento de arquivos
  └── Realtime       // (Futuro) WebSockets

// API
Next.js API Routes  // Endpoints serverless
Server Actions      // Ações do servidor (React)
```

---

## 📐 Arquitetura de Camadas

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│  (Components, Pages, UI)                │
├─────────────────────────────────────────┤
│         APPLICATION LAYER               │
│  (Business Logic, Server Actions)       │
├─────────────────────────────────────────┤
│         DATA ACCESS LAYER               │
│  (Supabase Client, API Calls)           │
├─────────────────────────────────────────┤
│         DATABASE LAYER                  │
│  (PostgreSQL + RLS + Storage)           │
└─────────────────────────────────────────┘
```

### 1. Presentation Layer (Componentes e Páginas)

**Responsabilidade**: Renderização da UI e interação com usuário

```
app/
├── (public)/              # Rotas públicas
│   ├── page.tsx          # Catálogo (Server Component)
│   └── produtos/[slug]/  # Detalhes (Server Component)
├── (auth)/               # Rotas de autenticação
│   └── login/           # Login (Client Component)
└── admin/               # Rotas administrativas
    ├── dashboard/       # Dashboard (Server Component)
    └── produtos/        # CRUD (Mixed: Server + Client)
```

**Padrões**:
- Server Components por padrão (melhor performance)
- Client Components (`'use client'`) apenas para interatividade
- Layouts compartilhados para consistência
- Loading states e error boundaries

### 2. Application Layer (Lógica de Negócio)

**Responsabilidade**: Processamento de dados e regras de negócio

```
app/admin/produtos/actions.ts   # Server Actions
app/api/upload/route.ts         # API Routes
lib/supabase/middleware.ts      # Auth middleware
```

**Server Actions** (Preferido):
```typescript
'use server'

export async function createProduto(formData: ProdutoFormData) {
  const supabase = await createClient()
  // Validação, processamento, inserção
  return { success: true, data }
}
```

**API Routes** (Quando necessário):
```typescript
export async function POST(request: NextRequest) {
  // Upload de arquivos, webhooks, etc.
}
```

### 3. Data Access Layer (Acesso a Dados)

**Responsabilidade**: Comunicação com o banco de dados

```
lib/supabase/
├── client.ts              # Cliente browser (Client Components)
├── server.ts             # Cliente server (Server Components)
└── middleware.ts         # Auth e session management
```

**Cliente Server** (Server Components):
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('produtos').select('*')
```

**Cliente Browser** (Client Components):
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('produtos').select('*')
```

### 4. Database Layer (Banco de Dados)

**Responsabilidade**: Armazenamento persistente e segurança

- **PostgreSQL**: Banco relacional com índices otimizados
- **RLS (Row Level Security)**: Segurança a nível de linha
- **Triggers**: Automações (updated_at, histórico, etc.)
- **Functions**: Lógica complexa no banco
- **Storage**: Arquivos binários (imagens)

---

## 🔄 Fluxo de Dados

### Fluxo de Leitura (Catálogo Público)

```
User Request
    ↓
Next.js Server Component (app/(public)/page.tsx)
    ↓
createClient (server) [lib/supabase/server.ts]
    ↓
Supabase Query (SELECT com RLS)
    ↓
PostgreSQL (filtra dados públicos via RLS)
    ↓
Return Data
    ↓
Server Component Renders (SSR)
    ↓
HTML enviado ao browser
```

### Fluxo de Escrita (Admin CRUD)

```
User Action (Client Component)
    ↓
Server Action [app/admin/produtos/actions.ts]
    ↓
Validation (TypeScript + Zod)
    ↓
createClient (server) [lib/supabase/server.ts]
    ↓
Auth Check (getUser)
    ↓
Supabase Mutation (INSERT/UPDATE/DELETE)
    ↓
PostgreSQL (valida RLS + constraints)
    ↓
Triggers Execute (updated_at, histórico)
    ↓
Return Result
    ↓
Client Component Updates (revalidate)
    ↓
UI Refresh
```

### Fluxo de Upload de Imagens

```
User Select Files (Client Component)
    ↓
ImageUpload Component [components/admin/image-upload.tsx]
    ↓
Validation (client-side: type, size)
    ↓
FormData + POST /api/upload
    ↓
API Route [app/api/upload/route.ts]
    ↓
Auth Check (server-side)
    ↓
Validation (server-side: type, size)
    ↓
Supabase Storage Upload
    ↓
Generate Public URL
    ↓
Return URL to Client
    ↓
Update Form State
```

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

```
1. User → /login
2. Email + Password
3. Supabase Auth (JWT)
4. Cookie Set (httpOnly)
5. Redirect → /admin/dashboard
```

### Middleware de Autenticação

**Arquivo**: `lib/supabase/middleware.ts`

```typescript
export async function updateSession(request: NextRequest) {
  // 1. Fast check: Cookie exists?
  const accessToken = request.cookies.get('sb-*-auth-token')

  // 2. Redirect se não autenticado em rota admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. Verify token with timeout (3s)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}
```

### Proteção de Rotas

**Client-side** (Layout Guard):
```typescript
// app/admin/layout.tsx
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

**Server-side** (Server Actions):
```typescript
export async function createProduto() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  // ...
}
```

**Database-level** (RLS):
```sql
CREATE POLICY "Admins podem inserir produtos"
ON produtos FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Níveis de Segurança

1. **Middleware**: Proteção de rotas (fast check)
2. **Layout/Page**: Verificação de sessão
3. **Server Actions**: Verificação de autenticação
4. **API Routes**: Verificação de autenticação
5. **Database (RLS)**: Última camada de segurança

---

## 🗺️ Sistema de Rotas

### Route Groups

O Next.js App Router usa **Route Groups** `()` para organização sem afetar URLs:

```
app/
├── (public)/              # Grupo: Rotas públicas
│   ├── layout.tsx        # Layout público
│   ├── page.tsx          # URL: /
│   └── produtos/
│       └── [slug]/
│           └── page.tsx  # URL: /produtos/[slug]
│
├── (auth)/               # Grupo: Autenticação
│   ├── layout.tsx       # Layout simples
│   └── login/
│       └── page.tsx     # URL: /login
│
└── admin/               # Grupo: Admin (SEM parênteses = /admin)
    ├── layout.tsx       # Layout com sidebar
    ├── dashboard/
    │   └── page.tsx     # URL: /admin/dashboard
    └── produtos/
        ├── page.tsx     # URL: /admin/produtos
        ├── novo/
        │   └── page.tsx # URL: /admin/produtos/novo
        └── [id]/
            └── page.tsx # URL: /admin/produtos/[id]
```

### Dynamic Routes

**Produto por Slug** (Público):
```typescript
// app/(public)/produtos/[slug]/page.tsx
export default async function ProdutoPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params  // Next.js 15: params é Promise
  const produto = await fetchProdutoBySlug(slug)
  // ...
}
```

**Editar Produto por ID** (Admin):
```typescript
// app/admin/produtos/[id]/page.tsx
export default function EditProdutoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)  // Client Component: use React.use()
  // ...
}
```

---

## 🎨 Gerenciamento de Estado

### Server State (Dados do Banco)

**Preferência**: Server Components (sem estado)

```typescript
// Server Component (default)
export default async function ProdutosPage() {
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')

  return <ProdutosTable produtos={produtos} />
}
```

**Revalidation** após mutações:
```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function createProduto(data) {
  await supabase.from('produtos').insert(data)
  revalidatePath('/admin/produtos')  // Revalida cache
  redirect('/admin/produtos')
}
```

### Client State (UI e Formulários)

**useState** para UI local:
```typescript
'use client'

export function ImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  // ...
}
```

**Formulários**:
```typescript
'use client'

export function ProdutoForm() {
  const [formData, setFormData] = useState<ProdutoFormData>({...})

  async function handleSubmit(e) {
    e.preventDefault()
    await createProduto(formData)  // Server Action
  }
}
```

### Sem Redux/Zustand

O projeto **NÃO** usa bibliotecas de estado global porque:
- Server Components eliminam necessidade
- Server Actions simplificam mutações
- URL é a fonte de verdade (filtros, paginação)
- Local state suficiente para UI

---

## 📦 Upload e Storage

### Arquitetura de Upload

```
Client (ImageUpload Component)
    ↓
Multiple File Selection
    ↓
Client Validation (type, size, count)
    ↓
FormData para cada arquivo
    ↓
POST /api/upload (um request por arquivo)
    ↓
API Route Handler
    ↓
Server Validation
    ↓
Auth Check
    ↓
Supabase Storage Upload (bucket: produtos)
    ↓
Generate Public URL
    ↓
Return URL[]
    ↓
Update Form State (fotos array)
```

### Bucket Configuration

**Nome**: `produtos`
**Visibilidade**: Público (read)
**Operações Admin**: Upload, Update, Delete
**Limites**: 5MB por arquivo, formatos: JPEG, PNG, WEBP
**Path**: `produtos/[timestamp]-[random].[ext]`

### CDN e Performance

- URLs públicas servidas via Supabase CDN
- Next.js otimiza via `next/image`
- Lazy loading automático
- Responsive images (srcset)

---

## ⚡ Performance e Otimizações

### 1. Server Components (Default)

```typescript
// ✅ Server Component (default - mais rápido)
export default async function Page() {
  const data = await fetch(...)  // Server-side
  return <UI data={data} />
}

// ❌ Evitar Client Component desnecessário
'use client'
export default function Page() {
  const [data, setData] = useState()
  useEffect(() => { fetch(...) }, [])
  return <UI data={data} />
}
```

### 2. Parallel Queries

```typescript
// ✅ Queries em paralelo
const [produtos, categorias, stats] = await Promise.all([
  supabase.from('produtos').select('*'),
  supabase.from('categorias').select('*'),
  supabase.rpc('get_stats')
])

// ❌ Queries sequenciais
const produtos = await supabase.from('produtos').select('*')
const categorias = await supabase.from('categorias').select('*')
const stats = await supabase.rpc('get_stats')
```

### 3. Índices no Banco

```sql
-- Índices críticos para performance
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo) WHERE ativo = true;
CREATE INDEX idx_produtos_slug ON produtos(slug);
CREATE INDEX idx_produtos_preco ON produtos(preco);
```

### 4. Image Optimization

```typescript
<Image
  src={url}
  alt={alt}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"  // Responsive
  className="object-cover"
  loading="lazy"  // Lazy loading
/>
```

### 5. Cache Strategy

- **Static Pages**: Geradas em build (catálogo)
- **Dynamic Pages**: Revalidação on-demand
- **API Routes**: Cache HTTP headers

---

## 🔧 Convenções e Padrões

### Nomenclatura

- **Arquivos**: kebab-case (`produto-form.tsx`)
- **Componentes**: PascalCase (`ProdutoForm`)
- **Funções**: camelCase (`createProduto`)
- **Constantes**: UPPER_CASE (`MAX_FILE_SIZE`)

### Estrutura de Componentes

```typescript
'use client'  // Se necessário

// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types
interface Props {
  produto: Produto
}

// 3. Component
export function ProdutoCard({ produto }: Props) {
  // 4. State
  const [loading, setLoading] = useState(false)

  // 5. Handlers
  async function handleClick() {
    // ...
  }

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Error Handling

```typescript
try {
  const result = await action()

  if (result.error) {
    toast.error(result.error)
    return
  }

  toast.success('Sucesso!')
} catch (error) {
  console.error('Erro:', error)
  toast.error('Erro inesperado')
}
```

---

## 📝 Resumo da Arquitetura

1. **Next.js 15 App Router** com Server Components
2. **Supabase** para backend (DB + Auth + Storage)
3. **TypeScript** para type safety
4. **Server Actions** para mutações
5. **API Routes** para casos específicos (upload)
6. **RLS** para segurança em todas as camadas
7. **Optimistic UI** e revalidação automática
8. **Performance-first** com SSR e otimizações

---

**📌 IMPORTANTE**: Sempre siga esta arquitetura ao adicionar novas funcionalidades. Documente mudanças significativas neste arquivo.
