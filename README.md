# 📱 Léo iPhone - Sistema de Catálogo de Produtos

> Sistema completo de catálogo de iPhones com painel administrativo, autenticação e gerenciamento de produtos.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
- [Documentação Completa](#documentação-completa)
- [Funcionalidades](#funcionalidades)
- [Deploy](#deploy)

---

## 🎯 Sobre o Projeto

O **Léo iPhone** é uma aplicação web moderna para gerenciar e exibir um catálogo de iPhones (novos e seminovos). O sistema possui:

- **Catálogo Público**: Listagem de produtos com filtros, busca e seções destacadas
- **Painel Administrativo**: Gerenciamento completo de produtos, categorias e uploads
- **Sistema de Autenticação**: Login seguro para administradores
- **Upload de Imagens**: Sistema completo de upload para Supabase Storage
- **Migração de Dados**: Scripts para migrar dados do Firebase para Supabase

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React com App Router e Turbopack
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de UI
- **Lucide React** - Ícones

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL (Database)
  - Auth (Autenticação)
  - Storage (Armazenamento de imagens)
  - Row Level Security (RLS)

### Ferramentas
- **ESLint** - Linting
- **Prettier** - Formatação de código
- **Sonner** - Toast notifications

---

## 📁 Estrutura do Projeto

```
leoiphone_2/
├── app/                          # Aplicação Next.js (App Router)
│   ├── (auth)/                   # Rotas de autenticação
│   │   └── login/
│   ├── (public)/                 # Rotas públicas
│   │   ├── page.tsx             # Catálogo (homepage)
│   │   └── produtos/[slug]/     # Detalhes do produto
│   ├── admin/                    # Painel administrativo
│   │   ├── dashboard/
│   │   ├── produtos/
│   │   ├── categorias/
│   │   ├── banners/
│   │   ├── secoes/
│   │   ├── avaliacoes/
│   │   └── analytics/
│   ├── api/                      # API Routes
│   │   └── upload/              # Upload de imagens
│   ├── layout.tsx               # Layout raiz
│   └── globals.css              # Estilos globais
│
├── components/                   # Componentes React
│   ├── admin/                   # Componentes do admin
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── image-upload.tsx     # Upload de imagens
│   │   └── produtos-table.tsx
│   ├── ui/                      # Componentes shadcn/ui
│   └── ...
│
├── lib/                         # Bibliotecas e utilitários
│   ├── supabase/
│   │   ├── client.ts           # Cliente Supabase (browser)
│   │   ├── server.ts           # Cliente Supabase (server)
│   │   └── middleware.ts       # Auth middleware
│   └── utils.ts                # Funções auxiliares
│
├── types/                       # Definições TypeScript
│   └── produto.ts
│
├── public/                      # Arquivos estáticos
│   ├── icons/
│   └── images/
│
├── docs/                        # Documentação (IMPORTANTE!)
│   ├── ARCHITECTURE.md         # Arquitetura do sistema
│   ├── FILE-MAP.md            # Mapa de todos os arquivos
│   ├── DEVELOPMENT-GUIDE.md   # Guia de desenvolvimento
│   └── DATABASE.md            # Documentação do banco
│
├── supabase-schema.sql         # Schema completo do banco
├── supabase-storage.sql        # Configuração do storage
├── reativar-rls.sql           # Script para reativar RLS
├── migrate.mjs                # Script de migração Firebase → Supabase
├── proxy.ts                   # Proxy do Next.js (auth)
├── next.config.ts             # Configuração Next.js
├── tailwind.config.ts         # Configuração Tailwind
├── tsconfig.json              # Configuração TypeScript
├── package.json               # Dependências
└── README.md                  # Este arquivo
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Editor de código (VS Code recomendado)

### 1. Clone o repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd leoiphone_2
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://aswejqbtejibrilrblnm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 4. Configure o banco de dados

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute os scripts na ordem:
   - `supabase-schema.sql` - Cria todas as tabelas e configurações
   - `supabase-storage.sql` - Configura o bucket de imagens

### 5. Rode o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

### 6. (Opcional) Migrar dados do Firebase

Se você tem dados no Firebase:

```bash
# Teste (dry run)
SET DRY_RUN=true
node migrate.mjs

# Migração real
node migrate.mjs --clear
```

Depois, reative o RLS:
```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: reativar-rls.sql
```

---

## 📚 Documentação Completa

**⚠️ IMPORTANTE para IAs e desenvolvedores:**

Antes de trabalhar no projeto, leia TODOS os arquivos de documentação na pasta `docs/`:

1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitetura geral do sistema
2. **[docs/FILE-MAP.md](docs/FILE-MAP.md)** - O QUE CADA ARQUIVO FAZ (ESSENCIAL!)
3. **[docs/DEVELOPMENT-GUIDE.md](docs/DEVELOPMENT-GUIDE.md)** - Como desenvolver novas features
4. **[docs/DATABASE.md](docs/DATABASE.md)** - Estrutura do banco de dados

Esses arquivos contêm informações detalhadas sobre:
- Como cada parte do sistema funciona
- Onde adicionar novas funcionalidades
- Padrões de código a seguir
- Estrutura do banco de dados
- Fluxos de autenticação
- E muito mais...

---

## ✨ Funcionalidades

### Catálogo Público (/)
- ✅ Listagem de produtos com paginação
- ✅ Filtros por categoria, condição, preço
- ✅ Busca por nome
- ✅ Seções destacadas (Destaques, Promoções, Lançamentos)
- ✅ Detalhes do produto com galeria de fotos
- ✅ Design responsivo

### Painel Admin (/admin)
- ✅ Dashboard com estatísticas
- ✅ CRUD completo de produtos
- ✅ Upload de múltiplas imagens (até 5 por produto)
- ✅ Gerenciamento de categorias
- ✅ Soft delete de produtos
- ✅ Filtros e busca
- ✅ Autenticação segura

### Sistema de Upload
- ✅ Upload para Supabase Storage
- ✅ Validação de tipo e tamanho (max 5MB)
- ✅ Preview com reordenação
- ✅ Definir foto principal
- ✅ Remover fotos individuais
- ✅ Barra de progresso

### Banco de Dados
- ✅ PostgreSQL com Supabase
- ✅ Row Level Security (RLS)
- ✅ Índices otimizados
- ✅ Triggers automáticos
- ✅ Funções SQL customizadas

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte o repositório no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy automático!

### Variáveis de Ambiente (Produção)

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

---

## 🔐 Credenciais de Acesso

### Admin (Painel)
- URL: `/login`
- Configurar no Supabase Auth

### Supabase
- URL: https://aswejqbtejibrilrblnm.supabase.co
- Configurar chaves no `.env.local`

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção

# Qualidade de Código
npm run lint         # Executa ESLint

# Banco de Dados
node migrate.mjs     # Migra dados do Firebase (com --clear)
```

---

## 🤝 Contribuindo

### Regras Importantes

1. **SEMPRE documente novos arquivos** em `docs/FILE-MAP.md`
2. **SEMPRE documente novas funcionalidades** em `docs/DEVELOPMENT-GUIDE.md`
3. **Siga os padrões de código** descritos na documentação
4. **Teste localmente** antes de commitar
5. **Escreva commits descritivos**

### Workflow

1. Leia toda a documentação em `docs/`
2. Crie uma branch para sua feature
3. Desenvolva seguindo os padrões
4. Documente as mudanças
5. Teste tudo
6. Faça pull request

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação em `docs/`
2. Verifique os arquivos de guia (SETUP-UPLOAD.md, MIGRAÇÃO.md, etc.)
3. Verifique o console do navegador para erros
4. Verifique os logs do Supabase Dashboard

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 🎯 Status do Projeto

- ✅ **Catálogo Público**: 100% funcional
- ✅ **Painel Admin**: 100% funcional
- ✅ **Autenticação**: 100% funcional
- ✅ **Upload de Imagens**: 100% funcional
- ✅ **Migração Firebase**: 100% concluída (195 produtos)
- ⚠️ **Banners**: Estrutura criada, implementação pendente
- ⚠️ **Seções Home**: Estrutura criada, implementação pendente
- ⚠️ **Avaliações**: Estrutura criada, implementação pendente
- ⚠️ **Analytics**: Estrutura criada, implementação pendente

---

## 🔄 Última Atualização

**Data**: 2025-01-25
**Versão**: 1.0.0
**Migração**: Firebase → Supabase concluída
**Produtos**: 195 migrados com sucesso
**Categorias**: 25 migradas com sucesso

---

**⚠️ LEMBRE-SE: Sempre consulte a documentação em `docs/` antes de fazer alterações no projeto!**
