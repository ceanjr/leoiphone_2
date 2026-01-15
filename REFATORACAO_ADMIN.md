# Relatório de Refatoração - Área Administrativa LeoiPhone

## Visão Geral

Este documento detalha as etapas necessárias para refatorar completamente a área administrativa do site LeoiPhone, utilizando como referência a implementação simplificada do projeto sriphone_2.

**Princípios Guia:**

- Clean Code
- Mobile-first
- Performance otimizada
- Remoção de código não utilizado

---

## ETAPA 1: Remoção de Anúncios [CONCLUÍDA]

### Situação Anterior

- Página de anúncios com integração Facebook e OLX
- Componentes complexos para gerenciamento de marketplace

### O que foi feito

- [x] **1.1** Remover página de anúncios:
  - `/app/admin/anuncios/page.tsx` - REMOVIDO
  - `/app/admin/anuncios/actions.ts` - REMOVIDO
  - `/app/admin/anuncios/olx-actions.ts` - REMOVIDO
  - `/app/admin/anuncios/oauth-olx/` (pasta inteira) - REMOVIDO

- [x] **1.2** Remover componentes de anúncios:
  - `/components/admin/anuncios/` (pasta inteira) - REMOVIDO

- [x] **1.3** Remover do menu/sidebar:
  - Link "Anúncios" removido do sidebar
  - Link removido do mobile-nav

- [x] **1.4** Remover arquivos relacionados:
  - `/lib/api/facebook/` - REMOVIDO
  - `/lib/api/olx/` - REMOVIDO
  - `/app/api/olx-token/` - REMOVIDO
  - `/app/api/test-olx-payload/` - REMOVIDO
  - `/types/olx.ts` - REMOVIDO
  - `/types/facebook.ts` - REMOVIDO
  - Referência `olxAuth` em `/lib/config/constants.ts` - REMOVIDO

- [ ] **1.5** Limpar tabelas do banco (opcional - fazer quando necessário):
  - `facebook_anuncios`
  - `olx_anuncios`
  - `facebook_config`
  - `olx_config`

---

## ETAPA 2: Layout Geral [CONCLUÍDA]

### Situação Anterior

- Sidebar com link para Anúncios
- Mobile nav com mesmos itens
- "Ver Catálogo" abria em nova aba

### O que foi feito

- [x] **2.1** Refatorar sidebar:
  - Itens mantidos: Dashboard, Produtos, Categorias, Banners, Taxas
  - Adicionado: Produtos Relacionados (nova página)
  - "Ver Catálogo" agora abre na mesma aba
  - Botão Logout mantido
  - Anúncios removido

- [x] **2.2** Refatorar mobile nav:
  - Menu hamburguer mantido
  - Mesmos itens da sidebar
  - Botão Logout visível
  - "Ver Catálogo" abre na mesma aba

- [x] **2.3** Criar utilitário de logout:
  - Criado `/lib/utils/auth-helpers.ts`
  - Funções: `clearAuthStorage()` e `performLogout()`
  - Usado em sidebar e mobile-nav (código duplicado removido)

### Arquivos Modificados

- `/components/admin/sidebar.tsx`
- `/components/admin/mobile-nav.tsx`

### Arquivos Criados

- `/lib/utils/auth-helpers.ts`

---

## ETAPA 3: Login e Autenticação [CONCLUÍDA]

### Situação Atual

- Login funciona corretamente via Supabase Auth
- Middleware protege rotas `/admin/*`
- Persistência de sessão via cookies

### O que foi verificado/mantido

- [x] **3.1** Persistência de sessão:
  - Configuração de cookies do Supabase está correta
  - Sessão persiste entre recargas
  - Timeout de 3 segundos para validação (com fallback)

- [x] **3.2** Proteção de rotas admin:
  - Middleware redireciona não-autenticados para `/login`
  - Todas as rotas `/admin/*` estão protegidas
  - Usuário logado é redirecionado de `/login` para `/admin/dashboard`

- [x] **3.3** UX de logout melhorada:
  - Limpa localStorage e sessionStorage
  - Reseta singleton do Supabase client
  - Redireciona para login

- [x] **3.4** Lógica de logout extraída:
  - Utilitário criado em `/lib/utils/auth-helpers.ts`
  - Usado em sidebar e mobile-nav

### Arquivos Verificados

- `/lib/supabase/middleware.ts` - OK
- `/hooks/use-auth.ts` - OK
- `/app/(auth)/login/actions.ts` - OK

---

## ETAPA 4: Categorias [CONCLUÍDA]

### Situação Anterior

- Página gerencia categorias + produtos relacionados (misturado)
- Arquivo: `/app/admin/categorias/page.tsx` (845 linhas)
- Modais para produtos relacionados
- Drag-and-drop manual com HTML5 API (sem biblioteca)

### O que foi feito

- [x] **4.1** Recriar estrutura de páginas:
  - `/admin/categorias/page.tsx` - listagem com drag-and-drop (simplificada)
  - `/admin/categorias/nova/page.tsx` - adicionar categoria
  - `/admin/categorias/[id]/editar/page.tsx` - editar categoria

- [x] **4.2** Implementar drag-and-drop com @dnd-kit:
  - Instalado: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
  - Criado componente `CategoryList` com `SortableContext`
  - Criado subcomponente `SortableCategoryItem` com `useSortable`
  - Feedback visual ao arrastar (opacity 0.5, shadow, z-index 50)

- [x] **4.3** Implementar handle de arrasto e botões:
  - Drag handle (6 pontos SVG) para arrastar
  - Botões seta cima/baixo como alternativa
  - Sincronização com banco após cada mudança
  - Toast de feedback "Ordem atualizada"

- [x] **4.4** Remover modais de produtos relacionados da página:
  - Removido `modal-produtos-relacionados.tsx`
  - Removido `modal-produtos-relacionados-destaque.tsx`
  - Removido `produtos-relacionados-form.tsx`
  - Funcionalidade movida para `/admin/produtos-relacionados`

- [x] **4.5** Criar formulário de categoria:
  - Campos: nome, ativo (checkbox)
  - Slug gerado automaticamente
  - Validação de duplicidade
  - Auto-incremento de `ordem`

- [x] **4.6** Implementar deleção segura:
  - Verifica se categoria tem produtos associados
  - Bloqueia deleção se houver produtos
  - Recalcula ordem após deleção
  - Dialog de confirmação

- [x] **4.7** Mobile-first:
  - Layout responsivo único (cards)
  - Touch-friendly drag handles com `touch-none`
  - Toggle ativo/inativo inline

### Arquivos Criados

- `/app/admin/categorias/page.tsx` (reescrito - 45 linhas)
- `/app/admin/categorias/nova/page.tsx`
- `/app/admin/categorias/[id]/editar/page.tsx`
- `/components/admin/categorias/category-list.tsx`
- `/components/admin/categorias/category-form.tsx`

### Arquivos Removidos

- `/components/admin/modal-produtos-relacionados.tsx`
- `/components/admin/modal-produtos-relacionados-destaque.tsx`
- `/components/admin/produtos-relacionados-form.tsx`

### Arquivos Modificados

- `/app/admin/categorias/actions.ts` (adicionada função `getCategoriaById`)

---

## ETAPA 5: Produtos [CONCLUÍDA]

### Situação Anterior

- Página lenta e mal otimizada
- Modal complexo para criar/editar produtos
- Arquivos: `/app/admin/produtos/page.tsx`, `/components/admin/produtos/`

### O que foi feito

- [x] **5.1** Recriar estrutura de páginas:
  - `/admin/produtos/page.tsx` - listagem (server component)
  - `/admin/produtos/novo/page.tsx` - adicionar produto
  - `/admin/produtos/[id]/editar/page.tsx` - editar produto

- [x] **5.2** Criar componente `ProductListAdmin`:
  - Desktop: tabela com colunas (Imagem, Código, Nome, Preço, Status, Ações)
  - Mobile: cards com informações compactas
  - Toggle ativo/inativo inline
  - Link no nome do produto abre em nova aba

- [x] **5.3** Criar componente `ProductsContent`:
  - Filtro por categoria (apenas categorias com produtos)
  - Filtro por status (Todos/Ativos/Inativos)
  - Ordenação igual ao catálogo (por modelo e capacidade)

- [x] **5.4** Criar componente `ProductForm`:
  - Formulário standalone (não modal)
  - Campos: código, nome, preço, bateria, condição, categoria, estoque, garantia
  - Suporte a múltiplas cores (com detecção de iPhone)
  - Seção de acessórios (checkboxes)
  - Integração com CustosManager existente
  - Checkbox de ativo/inativo

- [x] **5.5** Manter ImageUpload existente:
  - Componente já funcional
  - Upload para Supabase Storage
  - Preview com reordenação (definir principal)

- [x] **5.6** Remover componentes obsoletos:
  - `products-manager.tsx` - REMOVIDO
  - `product-form-dialog.tsx` - REMOVIDO
  - `produtos-table.tsx` - REMOVIDO
  - `produtos-table-simple.tsx` - REMOVIDO
  - `export-images-dialog.tsx` - REMOVIDO
  - `export-story-dialog.tsx` - REMOVIDO

### Arquivos Criados

- `/app/admin/produtos/page.tsx` (reescrito)
- `/app/admin/produtos/novo/page.tsx`
- `/app/admin/produtos/[id]/editar/page.tsx`
- `/components/admin/produtos/products-content.tsx`
- `/components/admin/produtos/product-list-admin.tsx`
- `/components/admin/produtos/product-form.tsx`

### Arquivos Removidos

- `/components/admin/produtos/products-manager.tsx`
- `/components/admin/produtos/product-form-dialog.tsx`
- `/components/admin/produtos/export-images-dialog.tsx`
- `/components/admin/produtos/export-story-dialog.tsx`
- `/components/admin/produtos-table.tsx`
- `/components/admin/produtos-table-simple.tsx`

### Arquivos Modificados

- `/app/admin/produtos/actions.ts` (adicionada tipagem explícita em getProdutoById)

---

## ETAPA 6: Banners [CONCLUÍDA]

### Situação Anterior

- Arquivo grande: `/app/admin/banners/page.tsx` (1,125 linhas)
- Modal para adicionar/editar
- Tabela manual sem drag-and-drop

### O que foi feito

- [x] **6.1** Implementar drag-and-drop para ordenação:
  - Criado componente `BannerList` com @dnd-kit
  - Criado subcomponente `SortableBannerItem` com `useSortable`
  - Feedback visual ao arrastar (opacity 0.5, shadow, z-index 50)
  - Sincronização com banco após cada mudança
  - Botões seta cima/baixo como alternativa para mobile

- [x] **6.2** Refatorar listagem:
  - Removido tabela manual, substituído por BannerList
  - Toggle ativo/inativo inline com feedback visual
  - Dialog de confirmação para exclusão
  - Preview de imagem ou ícone para produtos_destaque

- [x] **6.3** Manter funcionalidades existentes:
  - Dois tipos: banner e produtos_destaque
  - Modal para criação/edição (mantido)
  - Upload de imagem
  - Seleção de produtos (para produtos_destaque)
  - Countdown timer
  - Agendamento (active_from, active_until)

- [x] **6.4** Mobile-first:
  - Cards responsivos com informações compactas
  - Botões de ação touch-friendly
  - Handle de arrasto visível

### Arquivos Criados

- `/components/admin/banners/banner-list.tsx`

### Arquivos Modificados

- `/app/admin/banners/page.tsx` (simplificado para usar BannerList)

---

## ETAPA 7: Taxas [CONCLUÍDA]

### Situação Anterior

- Funciona bem
- Presets sem indicação visual do ativo

### O que foi feito

- [x] **7.1** Destacar preset ativo:
  - Função `isPresetActive` para detectar preset correspondente às taxas atuais
  - Borda amarela (--brand-yellow) no preset ativo
  - Background com tint amarelo sutil
  - Badge "Ativo" no preset selecionado
  - Botão "Aplicar" desabilitado quando preset já está ativo

### Arquivos Modificados

- `/app/admin/taxas/page.tsx`

---

## ETAPA 8: Dashboard [CONCLUÍDA]

### Situação Anterior

- Arquivo: `/app/admin/dashboard/page.tsx` (762 linhas)
- Múltiplas métricas desnecessárias
- Seção "Métricas do Site" com calculadora
- Botões "Zerar Views" e "Aleatorizar"

### O que foi feito

- [x] **8.1** Remover métricas não necessárias:
  - Removido: Visualizações totais
  - Removido: Taxa de conversão
  - Removido: Receita potencial

- [x] **8.2** Manter métricas essenciais:
  - Usuários online (últimos 5 min)
  - Visitantes (hoje/mês com toggle)
  - Total de produtos (com contagem de ativos)

- [x] **8.3** Remover seção "Métricas do Site":
  - Removido componente `SiteMetricsCard`
  - Removido import e uso

- [x] **8.4** Remover botões desnecessários:
  - Removido "Zerar Visualizações"
  - Removido "Aleatorizar Produtos Relacionados"
  - Removidos handlers e estados relacionados
  - Removidos ConfirmDialogs

- [x] **8.5** Manter seções úteis:
  - Produtos em Destaque - Cliques (métricas de banner)
  - Produtos Mais Visualizados (top 5)

### Arquivos Modificados

- `/app/admin/dashboard/page.tsx` (reduzido de 762 para ~550 linhas)

---

## ETAPA 9: Produtos Relacionados [CONCLUÍDA]

### Situação Anterior

- Funcionalidade misturada na página de Categorias
- Sistema complexo com descontos por categoria
- Produtos no banner também têm desconto

### O que foi feito

- [x] **9.1** Criar página `/admin/produtos-relacionados`:
  - Interface simples com toggle on/off
  - Ativa/desativa feature de produtos relacionados globalmente
  - Usa tabela `config_produtos_relacionados` existente

- [x] **9.2** Remover descontos dos produtos relacionados:
  - API retorna produtos sem desconto aplicado
  - Removido cálculo de `preco_com_desconto` e `desconto_percentual`
  - Removido import de `gerarDescontoConsistente`

- [x] **9.3** Implementar nova lógica de seleção:
  - Definidas constantes `CATEGORIAS_ACESSORIOS` e `CATEGORIAS_CELULARES_KEYWORDS`
  - Categorias de celulares (iPhone, Motorola, Realme, Samsung, Xiaomi, Lacrados):
    - Mostram produtos de categorias de acessórios
  - Categorias de acessórios (Apple, Amazon, Watch, Cabos, Som, Fones, iPad, Smartwatch, Videogames):
    - Mostram produtos de qualquer categoria
  - Fallback: mostrar acessórios

- [x] **9.4** Limitar a 3 produtos relacionados:
  - API já limitava a 3 produtos
  - Ordem determinística com seed configurável

### Arquivos Criados

- `/app/admin/produtos-relacionados/page.tsx`

### Arquivos Modificados

- `/app/admin/categorias/produtos-relacionados-actions.ts` (nova lógica simplificada)

---

## ETAPA 10: Filtros de Categoria [CONCLUÍDA]

### Situação Anterior

- Catálogo público exibia todas as categorias ativas, mesmo vazias
- Admin já filtrava categorias com produtos

### O que foi feito

- [x] **10.1** Catálogo público - filtro de categorias:
  - Adicionado `useMemo` para `categoriasComProdutos` em `use-home-data.ts`
  - Filtra categorias que têm pelo menos um produto ativo
  - Comparação feita via `categoria.id` do produto

- [x] **10.2** Admin produtos - filtro de categorias:
  - Já estava implementado em `products-content.tsx`
  - Usa `categoriesWithProducts` que filtra por contagem

### Arquivos Modificados

- `/hooks/use-home-data.ts` (adicionado filtro de categorias)

---

## ETAPA 11: Remoção do Preço de Custo do Catálogo [CONCLUÍDA]

### Situação Anterior

- Preço de custo era exibido no catálogo público para usuários autenticados
- `CustosTableDialog` aparecia nos cards de produtos
- Sistema carregava custos via `useHomeData`

### O que foi feito

- [x] **11.1** Remover preço de custo do catálogo público:
  - Removido `custos` e `isAuthenticated` props de `ProdutoCard`
  - Removido `CustosTableDialog` do componente
  - Removido `custosPorProduto` de `ProdutosPorCategoria`
  - Removido carregamento de custos de `useHomeData`

- [x] **11.2** Remover funcionalidade de seleção de produtos relacionados:
  - Simplificado `ProdutosRelacionados` para apenas exibir produtos
  - Removida funcionalidade de checkbox/seleção
  - Removida integração com WhatsApp (produtos selecionados)

### Arquivos Modificados

- `/components/public/produto-card.tsx` (removidos custos)
- `/components/public/home/ProdutosPorCategoria.tsx` (removidos custos)
- `/components/public/produtos-relacionados.tsx` (simplificado)
- `/hooks/use-home-data.ts` (removido loadCustos)
- `/app/(public)/page.tsx` (removidas props de custos)
- `/app/(public)/produto/[slug]/produto-page-client.tsx` (removida seleção)

---

## ETAPA 12: Limpeza do Repositório [CONCLUÍDA]

### Situação Anterior

- Arquivos órfãos após refatorações anteriores
- Utilitários não mais utilizados

### O que foi feito

- [x] **12.1** Arquivos removidos:
  - `/components/shared/custos-table-dialog.tsx` (não mais usado)
  - `/components/admin/site-metrics-card.tsx` (removido do dashboard)
  - `/lib/utils/desconto-colors.ts` (descontos removidos)

- [x] **12.2** Código morto removido:
  - Funções `zerarVisualizacoes` e `aleatorizarProdutosRelacionados` de `dashboard/actions.ts`
  - Estados e efeitos de produtos relacionados selecionados
  - Imports não utilizados

---

## Dependências a Instalar

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-dropzone
```

---

## Progresso

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 1 | Remoção de Anúncios | CONCLUÍDA |
| 2 | Layout Geral | CONCLUÍDA |
| 3 | Login/Autenticação | CONCLUÍDA |
| 4 | Categorias | CONCLUÍDA |
| 5 | Produtos | CONCLUÍDA |
| 6 | Banners | CONCLUÍDA |
| 7 | Taxas | CONCLUÍDA |
| 8 | Dashboard | CONCLUÍDA |
| 9 | Produtos Relacionados | CONCLUÍDA |
| 10 | Filtros de Categoria | CONCLUÍDA |
| 11 | Preço de Custo | CONCLUÍDA |
| 12 | Limpeza do Repositório | CONCLUÍDA |

---

## Observações Importantes

1. **Backup**: Git está configurado, usar commits frequentes
2. **Testes**: Testar cada etapa antes de prosseguir
3. **Mobile**: Sempre testar em viewport mobile
4. **Performance**: Monitorar tempo de carregamento
5. **Supabase Storage**: Leoiphone usa Supabase para imagens (não Cloudinary como sriphone_2)

---

## Checklist Final

- [x] Todas as etapas implementadas
- [ ] Sem erros de console
- [ ] Performance aceitável (< 3s load)
- [ ] Mobile responsivo
- [x] Autenticação funcionando
- [ ] Imagens sendo deletadas corretamente
- [x] Drag-and-drop funcionando em categorias e banners
- [x] Filtros de categoria funcionando
- [x] Produtos relacionados com nova lógica
- [x] Código limpo e organizado
