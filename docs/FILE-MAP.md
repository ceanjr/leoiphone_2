# 📂 Mapa Completo de Arquivos - Léo iPhone

> **IMPORTANTE PARA IAs E DESENVOLVEDORES**: Este documento descreve O QUE CADA ARQUIVO FAZ no projeto. Leia este arquivo COMPLETAMENTE antes de fazer qualquer alteração no código.

## 📌 Regra de Ouro

**SEMPRE QUE CRIAR UM NOVO ARQUIVO OU MODIFICAR SIGNIFICATIVAMENTE UM EXISTENTE, ATUALIZE ESTE DOCUMENTO!**

---

## 📋 Índice por Categoria

- [Configuração do Projeto](#configuração-do-projeto)
- [Aplicação Next.js (app/)](#aplicação-nextjs-app)
- [Componentes (components/)](#componentes-components)
- [Bibliotecas e Utilitários (lib/)](#bibliotecas-e-utilitários-lib)
- [Tipos TypeScript (types/)](#tipos-typescript-types)
- [Arquivos Públicos (public/)](#arquivos-públicos-public)
- [Scripts e Migração](#scripts-e-migração)
- [Documentação](#documentação)

---

## 🔧 Configuração do Projeto

### `package.json`
**O que faz**: Define dependências, scripts e metadados do projeto
**Quando modificar**: Ao adicionar/remover pacotes npm
**Scripts disponíveis**:
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - ESLint

### `next.config.ts`
**O que faz**: Configurações do Next.js
**Principais configurações**:
- `devIndicators: false` - Desabilita indicador de dev
- `images.remotePatterns` - Permite imagens de Firebase e Supabase
**Quando modificar**: Ao adicionar novos domínios de imagens ou configurações do Next.js

### `tailwind.config.ts`
**O que faz**: Configuração do Tailwind CSS
**Principais configurações**:
- Tema personalizado (cores, fontes)
- Variáveis CSS customizadas (--brand-yellow, --brand-black)
- Plugins (tailwindcss-animate)
**Quando modificar**: Ao adicionar cores/fontes/utilidades customizadas

### `tsconfig.json`
**O que faz**: Configuração do TypeScript
**Principais configurações**:
- Paths aliases (`@/*` → root)
- Compilação strict mode
- JSX preserve
**Quando modificar**: Raramente (apenas para ajustes avançados)

### `components.json`
**O que faz**: Configuração do shadcn/ui
**Define**:
- Estilo: New York
- Tema: Zinc (dark)
- Path dos componentes: `@/components/ui`
**Quando modificar**: Nunca (gerado pelo shadcn/ui CLI)

### `.prettierrc`
**O que faz**: Configuração do Prettier (formatação de código)
**Quando modificar**: Para ajustar regras de formatação

### `.prettierignore`
**O que faz**: Lista arquivos/pastas ignorados pelo Prettier
**Quando modificar**: Ao adicionar pastas que não devem ser formatadas

### `.gitignore`
**O que faz**: Lista arquivos/pastas ignorados pelo Git
**Inclui**: node_modules, .next, .env.local, etc.
**Quando modificar**: Ao adicionar arquivos sensíveis ou gerados

### `.env.local` (não versionado)
**O que faz**: Variáveis de ambiente locais
**Contém**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Quando modificar**: Ao configurar o projeto localmente

---

## 📱 Aplicação Next.js (app/)

### `app/layout.tsx`
**O que faz**: Layout raiz da aplicação
**Responsabilidades**:
- HTML base
- Metadata (title, description)
- Fontes (Geist Sans, Geist Mono)
- Providers (Toaster para notificações)
- Estilos globais
**Não modificar**: Exceto para mudanças globais

### `app/globals.css`
**O que faz**: Estilos CSS globais
**Contém**:
- Tailwind directives
- Variáveis CSS customizadas (:root)
- Tema dark mode
- Scrollbar personalizada
**Quando modificar**: Para adicionar variáveis CSS ou estilos globais

### `app/proxy.ts`
**O que faz**: Middleware do Next.js 16 (substitui middleware.ts)
**Responsabilidades**:
- Chama `updateSession` do Supabase
- Gerencia autenticação em todas as requisições
**Não modificar**: Core da autenticação

---

## 🏠 Rotas Públicas (app/(public)/)

### `app/(public)/layout.tsx`
**O que faz**: Layout para rotas públicas
**Características**:
- Sem sidebar
- Header simples
- Footer (se houver)
**Quando modificar**: Para ajustar layout público

### `app/(public)/page.tsx`
**O que faz**: Homepage / Catálogo de produtos
**Responsabilidades**:
- Busca produtos do banco
- Busca categorias para filtros
- Busca seções destacadas (destaques, promoções, lançamentos)
- Renderiza lista de produtos com filtros
**Queries**:
- `supabase.from('categorias').select('*')`
- `supabase.from('secoes_home').select('*')`
- `supabase.from('produtos_secoes').select('produto:produtos(*)')`
**Quando modificar**: Para ajustar lógica do catálogo

### `app/(public)/produtos/[slug]/page.tsx`
**O que faz**: Página de detalhes do produto
**Responsabilidades**:
- Busca produto por slug
- Exibe galeria de fotos
- Mostra informações detalhadas
- Botão WhatsApp
**Dynamic Route**: `[slug]` é o slug do produto
**Quando modificar**: Para adicionar informações/funcionalidades ao produto

---

## 🔐 Rotas de Autenticação (app/(auth)/)

### `app/(auth)/layout.tsx`
**O que faz**: Layout minimalista para páginas de auth
**Características**:
- Sem header/sidebar
- Centralizado
**Quando modificar**: Raramente

### `app/(auth)/login/page.tsx`
**O que faz**: Página de login
**Responsabilidades**:
- Formulário de email + senha
- Validação
- Autenticação via Supabase Auth
- Redirect para /admin após sucesso
**Client Component**: Sim (`'use client'`)
**Quando modificar**: Para ajustar UI ou lógica de login

---

## 🎛️ Painel Admin (app/admin/)

### `app/admin/layout.tsx`
**O que faz**: Layout do painel administrativo
**Responsabilidades**:
- Verifica autenticação (redirect se não autenticado)
- Renderiza Sidebar
- Renderiza Header
**Quando modificar**: Para ajustar estrutura do admin

### `app/admin/dashboard/page.tsx`
**O que faz**: Dashboard principal do admin
**Responsabilidades**:
- Exibe estatísticas (total produtos, ativos, inativos, etc.)
- Queries em paralelo com `Promise.all()`
- Cards com métricas
**Performance**: Queries otimizadas em paralelo
**Quando modificar**: Para adicionar novas métricas

### `app/admin/dashboard/error.tsx`
**O que faz**: Error boundary para dashboard
**Quando modificar**: Raramente

---

## 📦 Produtos Admin (app/admin/produtos/)

### `app/admin/produtos/page.tsx`
**O que faz**: Página de listagem de produtos no admin
**Responsabilidades**:
- Busca produtos via Server Action e entrega para o client component `ProdutosManager`
- Controla query params (`?modal=create|edit`) para abrir o formulário em modal
- Mantém apenas responsabilidades de data-fetching; toda interação fica no client
**Quando modificar**: Para mudar a estratégia de carregamento inicial ou parâmetros da página

### `app/admin/produtos/actions.ts`
**O que faz**: Server Actions para CRUD de produtos
**Funções**:
- `getProdutos()` - Lista todos
- `getProdutoById(id)` - Busca por ID
- `createProduto(data)` - Cria novo
- `updateProduto(id, data)` - Atualiza
- `deleteProduto(id)` - Soft delete
- `toggleProdutoAtivo(id, ativo)` - Ativa/desativa
- `getCategorias()` - Lista categorias
**Importante**: Todas verificam autenticação
**Quando modificar**: Para adicionar novas operações de produtos

### `components/admin/produtos/products-manager.tsx`
**O que faz**: Client component que orquestra a listagem e os modais
**Responsabilidades**:
- Renderiza cabeçalho, botão "Novo Produto" e tabela (`ProdutosTable`)
- Controla estado do `ProductFormDialog` (create/edit)
- Chama `router.refresh()` após salvar/deletar para atualizar dados
**Quando modificar**: Para alterar UX de criação/edição sem sair da página

### `components/admin/produtos/product-form-dialog.tsx`
**O que faz**: Modal reutilizável de cadastro/edição de produtos
**Responsabilidades**:
- Faz preload de categorias e, se necessário, do produto a ser editado
- Reaproveita `ImageUpload` e validações antes de chamar `createProduto` ou `updateProduto`
- Exibe feedback via `toast` e fecha modal ao concluir
**Quando modificar**: Para inserir novos campos, validações ou fluxos específicos no formulário
**Quando modificar**: Para adicionar campos ao formulário

---

## 🗂️ Outras Páginas Admin

### `app/admin/categorias/page.tsx`
**O que faz**: Placeholder para gestão de categorias
**Status**: Estrutura criada, implementação pendente
**Quando implementar**: CRUD de categorias

### `app/admin/banners/page.tsx`
**O que faz**: Placeholder para gestão de banners
**Status**: Estrutura criada, implementação pendente
**Quando implementar**: CRUD de banners do carrossel

### `app/admin/secoes/page.tsx`
**O que faz**: Placeholder para gestão de seções da home
**Status**: Estrutura criada, implementação pendente
**Quando implementar**: Gerenciar produtos em destaques/promoções/lançamentos

### `app/admin/avaliacoes/page.tsx`
**O que faz**: Placeholder para gestão de avaliações
**Status**: Estrutura criada, implementação pendente
**Quando implementar**: Aprovar/reprovar avaliações de clientes

### `app/admin/analytics/page.tsx`
**O que faz**: Placeholder para analytics
**Status**: Estrutura criada, implementação pendente
**Quando implementar**: Gráficos de visualizações, vendas, etc.

---

## 🌐 API Routes (app/api/)

### `app/api/upload/route.ts`
**O que faz**: API para upload de imagens
**Endpoints**:
- `POST /api/upload` - Faz upload de imagem
- `DELETE /api/upload?path=...` - Deleta imagem
**Validações**:
- Autenticação obrigatória
- Tipo de arquivo (image/*)
- Tamanho máximo (5MB)
**Storage**: Supabase Storage (bucket: produtos)
**Quando modificar**: Para adicionar validações ou processar imagens

---

## 🧩 Componentes Admin (components/admin/)

### `components/admin/header.tsx`
**O que faz**: Header do painel admin
**Exibe**:
- Título da página
- Descrição
- Botão de logout
**Quando modificar**: Para adicionar ações globais

### `components/admin/sidebar.tsx`
**O que faz**: Sidebar de navegação do admin
**Links**:
- Dashboard
- Produtos
- Categorias
- Banners
- Seções
- Avaliações
- Analytics
**Indica**: Link ativo
**Quando modificar**: Ao adicionar novas páginas admin

### `components/admin/produtos-table.tsx`
**O que faz**: Tabela de listagem de produtos
**Responsabilidades**:
- Renderiza produtos em tabela
- Mostra foto, nome, categoria, preço, condição, estoque, status
- Ações: Editar, Deletar, Ativar/Desativar
**Features**:
- `suppressHydrationWarning` (fix para extensões do browser)
- `sizes` prop no Image
**Quando modificar**: Para adicionar colunas ou ações

### `components/admin/image-upload.tsx`
**O que faz**: Componente de upload de múltiplas imagens
**Funcionalidades**:
- Upload de até 5 imagens
- Preview em grid
- Definir foto principal
- Remover imagens
- Drag & drop (futuro)
- Barra de progresso
- Validações (tipo, tamanho)
**API**: POST /api/upload
**Quando modificar**: Para adicionar crop, compressão, etc.

---

## 🎨 Componentes UI (components/ui/)

**O que faz**: Componentes do shadcn/ui
**Arquivos**:
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `label.tsx`
- `select.tsx`
- `table.tsx`
- `checkbox.tsx`
- `textarea.tsx`
- `toast.tsx`
- `toaster.tsx`
**Quando modificar**: NUNCA (gerados pelo CLI). Para customizar, edite o tema no `tailwind.config.ts`

---

## 📚 Bibliotecas e Utilitários (lib/)

### `lib/supabase/client.ts`
**O que faz**: Cliente Supabase para **Client Components**
**Uso**: Componentes com `'use client'`
**Quando usar**: Interações do browser (login, upload, etc.)

### `lib/supabase/server.ts`
**O que faz**: Cliente Supabase para **Server Components**
**Uso**: Server Components e Server Actions
**Quando usar**: Queries no servidor (SSR)

### `lib/supabase/middleware.ts`
**O que faz**: Gerencia autenticação e sessão
**Funções**:
- `updateSession(request)` - Atualiza sessão
- Fast check com cookie
- Timeout de 3s para verificar token
- Redirect para /login se não autenticado
**Quando modificar**: Para ajustar lógica de auth

### `lib/utils.ts`
**O que faz**: Funções utilitárias
**Funções**:
- `cn()` - Merge de classNames com Tailwind
**Quando modificar**: Para adicionar funções auxiliares

---

## 📐 Tipos TypeScript (types/)

### `types/produto.ts`
**O que faz**: Define tipos relacionados a produtos
**Tipos**:
- `Produto` - Produto completo do banco
- `ProdutoFormData` - Dados do formulário
- `Acessorios` - Objeto de acessórios
- `Condicao` - 'novo' | 'seminovo'
- `Garantia` - 'nenhuma' | '3_meses' | '6_meses' | '1_ano'
**Quando modificar**: Ao adicionar campos em produtos

---

## 🖼️ Arquivos Públicos (public/)

### `public/icons/`
**O que faz**: Ícones do site
**Arquivos**:
- `apple-icon.png`
- `icon.png`
**Quando modificar**: Para alterar ícones

### `public/images/`
**O que faz**: Imagens estáticas
**Arquivos**:
- `logo-black.svg`
- `logo-white.svg`
- `logo.svg`
**Quando modificar**: Para adicionar imagens fixas

### `public/next.svg` e `public/vercel.svg`
**O que faz**: Logos do Next.js e Vercel
**Quando modificar**: Pode deletar se não usar

---

## 🗄️ Scripts e Migração

### `migrate.mjs`
**O que faz**: Migra dados do Firebase para Supabase
**Responsabilidades**:
- Conecta no Firebase e Supabase
- Migra categorias
- Migra produtos
- Extrai nível de bateria da descrição
- Gera slugs únicos
- Trata códigos duplicados
**Uso**:
```bash
# Dry run
SET DRY_RUN=true
node migrate.mjs

# Migração real
node migrate.mjs --clear
```
**Quando modificar**: Apenas se precisar migrar novamente

### `supabase-schema.sql`
**O que faz**: Cria todo o schema do banco
**Cria**:
- Tabelas (categorias, produtos, avaliacoes, etc.)
- Índices
- Triggers
- Functions
- Políticas RLS
- Dados iniciais (seções_home)
**Quando executar**: Uma vez, no início do projeto
**Quando modificar**: Para adicionar tabelas/campos

### `supabase-storage.sql`
**O que faz**: Configura bucket de storage
**Cria**:
- Bucket `produtos`
- Políticas de acesso (público read, admin write)
**Quando executar**: Uma vez, para habilitar upload
**Quando modificar**: Para ajustar limites ou políticas

### `reativar-rls.sql`
**O que faz**: Reativa RLS após migração
**Quando executar**: Após rodar `migrate.mjs`
**Quando modificar**: Nunca

---

## 📖 Documentação

### `docs/ARCHITECTURE.md`
**O que faz**: Documenta arquitetura do sistema
**Contém**:
- Stack tecnológica
- Camadas da aplicação
- Fluxo de dados
- Autenticação
- Padrões de código
**Quando modificar**: Ao mudar arquitetura

### `docs/FILE-MAP.md` (ESTE ARQUIVO)
**O que faz**: Documenta o que cada arquivo faz
**Quando modificar**: **SEMPRE** que criar/modificar arquivos

### `docs/DEVELOPMENT-GUIDE.md`
**O que faz**: Guia de desenvolvimento
**Contém**:
- Como adicionar features
- Padrões de código
- Fluxos comuns
- Troubleshooting
**Quando modificar**: Ao definir novos padrões

### `docs/DATABASE.md`
**O que faz**: Documenta estrutura do banco
**Contém**:
- Schema de tabelas
- Relacionamentos
- Índices
- Políticas RLS
- Exemplos de queries
**Quando modificar**: Ao alterar banco

### `README.md`
**O que faz**: Documentação principal do projeto
**Contém**:
- Visão geral
- Instalação
- Tecnologias
- Links para docs/
**Quando modificar**: Para atualizações gerais

### `Guia-do-projeto.md`
**O que faz**: Guia antigo de desenvolvimento
**Status**: Pode ser removido (substituído por docs/)
**Quando modificar**: Não modificar (deprecated)

### `MIGRAÇÃO.md`
**O que faz**: Guia de migração Firebase → Supabase
**Quando modificar**: Se houver nova migração

### `PROXIMOS-PASSOS.md`
**O que faz**: Lista próximos passos do projeto
**Quando modificar**: Ao planejar novas features

### `SETUP-UPLOAD.md`
**O que faz**: Guia de configuração do upload
**Quando modificar**: Se mudar sistema de upload

### `migracao.md`
**O que faz**: Notas sobre migração
**Status**: Pode ser removido (duplicado)

---

## 🎯 Como Usar Este Documento

### Para IAs

Ao receber uma tarefa:

1. **Leia este arquivo COMPLETAMENTE**
2. Identifique quais arquivos você precisa modificar
3. Leia o conteúdo desses arquivos
4. Consulte `docs/ARCHITECTURE.md` para entender o contexto
5. Consulte `docs/DEVELOPMENT-GUIDE.md` para padrões
6. Faça as modificações
7. **ATUALIZE ESTE ARQUIVO** se criar novos arquivos

### Para Desenvolvedores

Antes de começar:

1. Leia `README.md`
2. Leia `docs/ARCHITECTURE.md`
3. Leia ESTE ARQUIVO
4. Leia `docs/DEVELOPMENT-GUIDE.md`
5. Agora sim, comece a codar!

---

## ✅ Checklist de Nova Funcionalidade

Quando adicionar uma nova feature:

- [ ] Implementar a funcionalidade
- [ ] Criar/modificar componentes necessários
- [ ] Adicionar Server Actions se necessário
- [ ] Atualizar tipos TypeScript
- [ ] Atualizar banco de dados (schema, RLS)
- [ ] Testar localmente
- [ ] **Atualizar FILE-MAP.md (ESTE ARQUIVO)**
- [ ] Atualizar DEVELOPMENT-GUIDE.md se for padrão novo
- [ ] Atualizar DATABASE.md se alterar banco
- [ ] Atualizar ARCHITECTURE.md se for mudança arquitetural

---

**🔥 LEMBRE-SE: Este documento é a FONTE DA VERDADE sobre o que cada arquivo faz. Mantenha-o atualizado!**

**📅 Última atualização**: 2025-01-25
