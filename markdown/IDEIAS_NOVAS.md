# 💡 Ideias e Melhorias para Léo iPhone

> **Análise realizada em:** 30 de Outubro de 2025
> **Status do Projeto:** Produção (Next.js 16 + Supabase + Vercel)

---

## 📋 Índice

1. [Features de Alto Impacto (Conversão)](#1-features-de-alto-impacto-conversão)
2. [Automações e Produtividade (Admin)](#2-automações-e-produtividade-admin)
3. [Melhorias de UX/UI](#3-melhorias-de-uxui)
4. [Integrações Externas](#4-integrações-externas)
5. [Analytics e Business Intelligence](#5-analytics-e-business-intelligence)
6. [Features de Marketing](#6-features-de-marketing)
7. [Melhorias Técnicas e Performance](#7-melhorias-técnicas-e-performance)
8. [Features Mobile-First](#8-features-mobile-first)
9. [Recursos Comunitários e Social](#9-recursos-comunitários-e-social)
10. [Automação de Processos](#10-automação-de-processos)

---

## 1. Features de Alto Impacto (Conversão)

### 🎯 PRIORIDADE ALTA

#### 1.1 Comparador de Produtos
**Objetivo:** Ajudar clientes a decidir entre modelos similares

**Funcionalidades:**
- Selecionar até 3 produtos para comparar lado a lado
- Destacar diferenças (bateria, garantia, preço, acessórios)
- Comparação de parcelas (qual é mais vantajoso?)
- Botão flutuante "Comparar (2)" quando produtos selecionados

**Impacto:** ↑ 15-20% conversão (reduz indecisão)
**Complexidade:** Média
**Tempo estimado:** 3-4 dias

```typescript
// Exemplo de uso
<ProductCard
  produto={produto}
  onCompareToggle={(id) => toggleCompare(id)}
  isComparing={compareList.includes(produto.id)}
/>

// Modal de comparação
<ComparadorDialog
  produtos={compareList}
  onRemove={removeFromCompare}
/>
```

**Dados a comparar:**
- ✅ Modelo e capacidade
- ✅ Preço à vista vs parcelado
- ✅ Condição (Novo/Seminovo + % bateria)
- ✅ Garantia
- ✅ Acessórios inclusos
- ✅ Diferença de preço entre eles

---

#### 1.2 Sistema de Notificações de Preço
**Objetivo:** Capturar leads de produtos fora do orçamento

**Funcionalidades:**
- Botão "Avisar quando baixar o preço" em produtos
- Cliente informa email/WhatsApp e preço desejado
- Notificação automática quando preço atinge meta
- Dashboard admin: lista de alertas ativos por produto

**Impacto:** ↑ 25-30% captura de leads
**Complexidade:** Média-Alta
**Tempo estimado:** 5-6 dias

**Tabela necessária:**
```sql
CREATE TABLE alertas_preco (
  id UUID PRIMARY KEY,
  produto_id UUID REFERENCES produtos(id),
  nome_cliente TEXT,
  contato TEXT, -- email ou telefone
  tipo_contato TEXT, -- 'email' | 'whatsapp'
  preco_atual DECIMAL,
  preco_desejado DECIMAL,
  notificado BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  notificado_at TIMESTAMP
);
```

**Trigger automático:**
```sql
-- Quando preço de produto muda, verificar se algum alerta deve ser disparado
CREATE TRIGGER notify_price_alerts
AFTER UPDATE ON produtos
FOR EACH ROW
WHEN (OLD.preco <> NEW.preco)
EXECUTE FUNCTION check_price_alerts();
```

---

#### 1.3 "Compre Junto" / Bundle Suggestions
**Objetivo:** Aumentar ticket médio com sugestões de acessórios

**Funcionalidades:**
- Na página do produto, mostrar "Compre junto e economize"
- Sugerir capinhas, películas, carregadores
- Calcular desconto no bundle (ex: 5% off se comprar 3+ itens)
- Botão "Adicionar tudo ao pedido" → envia para WhatsApp

**Impacto:** ↑ 10-15% ticket médio
**Complexidade:** Média
**Tempo estimado:** 4-5 dias

**Exemplo de exibição:**
```
┌─────────────────────────────────────────────────┐
│  Compre Junto e Economize                      │
├─────────────────────────────────────────────────┤
│  ☑ iPhone 15 Pro 128GB      R$ 4.999,00        │
│  ☑ Capinha MagSafe           R$ 149,00         │
│  ☑ Película 3D                R$ 89,00         │
│  ☑ Carregador 20W             R$ 99,00         │
├─────────────────────────────────────────────────┤
│  Total:        R$ 5.336,00                     │
│  Desconto 5%:  -R$ 266,80                      │
│  VOCÊ PAGA:    R$ 5.069,20                     │
│                                                 │
│  [ Adicionar Tudo ao Pedido ]                  │
└─────────────────────────────────────────────────┘
```

---

#### 1.4 Sistema de Favoritos / Wishlist
**Objetivo:** Permitir que usuários salvem produtos de interesse

**Funcionalidades:**
- Botão "♡" em cada produto (salvar nos favoritos)
- Persistir favoritos em localStorage (sem login) ou Supabase (com login)
- Página `/favoritos` com lista salva
- Notificar quando favorito entra em promoção

**Impacto:** ↑ 20% retorno de visitantes
**Complexidade:** Baixa-Média
**Tempo estimado:** 2-3 dias

**Implementação:**
```typescript
// Hook customizado
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage('favorites', [])

  const toggleFavorite = (produtoId: string) => {
    setFavorites(prev =>
      prev.includes(produtoId)
        ? prev.filter(id => id !== produtoId)
        : [...prev, produtoId]
    )
  }

  return { favorites, toggleFavorite, isFavorite: (id) => favorites.includes(id) }
}
```

---

#### 1.5 Filtros Avançados de Busca
**Objetivo:** Facilitar descoberta de produtos específicos

**Filtros a adicionar:**
- ✅ Faixa de preço (slider: R$ 500 - R$ 10.000)
- ✅ Condição (Novo / Seminovo)
- ✅ Bateria mínima (70%, 80%, 90%, 95%)
- ✅ Garantia (Nenhuma, 3m, 6m, 1 ano)
- ✅ Acessórios inclusos (Caixa, Carregador, Capinha, etc.)
- ✅ Capacidade de armazenamento (128GB, 256GB, 512GB, 1TB)
- ✅ Cor do aparelho (se você adicionar esse campo)

**Impacto:** ↑ 30% satisfação de usuário
**Complexidade:** Média
**Tempo estimado:** 3-4 dias

**UI sugerida:**
```
┌─────────────────────────────┐
│  Filtros                    │
├─────────────────────────────┤
│  Preço                      │
│  [====●=========] 500-5000  │
│                             │
│  Condição                   │
│  ☑ Novo                     │
│  ☑ Seminovo                 │
│                             │
│  Bateria Mínima             │
│  ○ Qualquer                 │
│  ● 80% ou mais              │
│  ○ 90% ou mais              │
│                             │
│  Garantia                   │
│  ☑ 3 meses                  │
│  ☑ 6 meses                  │
│  ☐ 1 ano                    │
│                             │
│  [ Limpar ] [ Aplicar ]     │
└─────────────────────────────┘
```

---

## 2. Automações e Produtividade (Admin)

### ⚡ PRIORIDADE ALTA

#### 2.1 Importação/Exportação CSV
**Objetivo:** Facilitar gestão em massa de produtos

**Funcionalidades:**
- **Exportar:** Baixar CSV com todos produtos (Excel-compatível)
- **Importar:** Upload CSV para criar/atualizar produtos em lote
- Validação de dados antes de importar
- Preview das mudanças antes de aplicar
- Log de erros (linhas que falharam)

**Impacto:** ↓ 80% tempo de cadastro em massa
**Complexidade:** Alta
**Tempo estimado:** 6-7 dias

**Formato CSV:**
```csv
codigo_produto,nome,slug,preco,nivel_bateria,condicao,categoria_slug,garantia,estoque,ativo
IPHONE15PM256,iPhone 15 Pro Max 256GB,iphone-15-pro-max-256gb,7999.00,NULL,novo,iphone-15-pro-max,1_ano,5,true
```

**Features do importador:**
- ✅ Validação de formato (Zod schema)
- ✅ Verificar se slug já existe (atualizar ou criar)
- ✅ Verificar se categoria existe
- ✅ Rollback em caso de erro crítico
- ✅ Relatório pós-importação

---

#### 2.2 Templates de Descrição de Produto
**Objetivo:** Padronizar descrições e economizar tempo

**Funcionalidades:**
- Criar templates reutilizáveis (ex: "Descrição iPhone Novo", "Descrição Seminovo")
- Suportar variáveis: `{{modelo}}`, `{{capacidade}}`, `{{garantia}}`
- Aplicar template ao criar/editar produto
- Biblioteca de templates no admin

**Impacto:** ↓ 70% tempo de redação
**Complexidade:** Baixa
**Tempo estimado:** 2 dias

**Exemplo de template:**
```
Título: iPhone {{modelo}} {{capacidade}} {{condicao}}

Descrição:
📱 {{modelo}} {{capacidade}} - {{condicao_formatada}}
{{#se_seminovo}}
🔋 Bateria: {{nivel_bateria}}%
{{/se_seminovo}}
✅ Garantia: {{garantia_formatada}}
📦 Acessórios: {{acessorios_lista}}

💳 Parcele em até 12x sem juros
📍 Entrega rápida para todo o Brasil
```

---

#### 2.3 Agendamento de Promoções
**Objetivo:** Automatizar mudanças de preço por período

**Funcionalidades:**
- Criar promoção com data início/fim
- Definir preço promocional (ou % desconto)
- Aplicar a produtos específicos ou categoria inteira
- Reverter automaticamente ao fim da promoção
- Badge "PROMOÇÃO" exibido automaticamente

**Impacto:** ↑ 15% vendas em períodos promocionais
**Complexidade:** Média-Alta
**Tempo estimado:** 5 dias

**Tabela:**
```sql
CREATE TABLE promocoes (
  id UUID PRIMARY KEY,
  nome TEXT,
  descricao TEXT,
  tipo TEXT, -- 'desconto_percentual' | 'preco_fixo'
  valor DECIMAL, -- 10 (%) ou 4999.00 (R$)
  data_inicio TIMESTAMP,
  data_fim TIMESTAMP,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE TABLE promocoes_produtos (
  promocao_id UUID REFERENCES promocoes(id),
  produto_id UUID REFERENCES produtos(id),
  preco_original DECIMAL, -- salvar para reverter
  PRIMARY KEY (promocao_id, produto_id)
);
```

**Cron Job (Vercel Cron ou Supabase pg_cron):**
```typescript
// api/cron/check-promocoes/route.ts
export async function GET() {
  const now = new Date()

  // Ativar promoções que começam agora
  const promocoesIniciar = await supabase
    .from('promocoes')
    .select('*, promocoes_produtos(*)')
    .lte('data_inicio', now)
    .gte('data_fim', now)
    .eq('ativo', true)

  // Aplicar preços promocionais...

  // Reverter promoções que acabaram
  const promocoesEncerrar = await supabase
    .from('promocoes')
    .select('*, promocoes_produtos(*)')
    .lt('data_fim', now)

  // Reverter aos preços originais...
}
```

---

#### 2.4 Duplicação Rápida de Produtos
**Objetivo:** Acelerar cadastro de produtos similares

**Funcionalidades:**
- Botão "Duplicar" em cada produto
- Copia todos os dados exceto: código, slug
- Sugerir novo código/slug automaticamente
- Abrir modal de edição com dados pré-preenchidos

**Impacto:** ↓ 60% tempo de cadastro
**Complexidade:** Baixa
**Tempo estimado:** 1 dia

---

#### 2.5 Histórico de Alterações (Audit Log)
**Objetivo:** Rastrear quem mudou o quê e quando

**Funcionalidades:**
- Registrar todas alterações em produtos
- Mostrar: usuário, campo alterado, valor antes/depois, timestamp
- Filtrar por produto, usuário, data
- Reverter alteração (rollback)

**Impacto:** ↑ Segurança e rastreabilidade
**Complexidade:** Média
**Tempo estimado:** 4 dias

**Tabela:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  tabela TEXT, -- 'produtos', 'categorias', etc.
  registro_id UUID,
  usuario_id UUID REFERENCES auth.users(id),
  acao TEXT, -- 'create', 'update', 'delete'
  campos_alterados JSONB, -- { "preco": { "antes": 4999, "depois": 4599 } }
  created_at TIMESTAMP
);
```

---

## 3. Melhorias de UX/UI

### 🎨 PRIORIDADE MÉDIA

#### 3.1 Visualização 360° de Produtos
**Objetivo:** Mostrar produto de todos os ângulos

**Funcionalidades:**
- Upload de múltiplas fotos do mesmo produto (frente, verso, laterais)
- Visualizador 360° interativo (arrastar mouse/dedo)
- Zoom nas imagens
- Thumbnail navigation

**Impacto:** ↑ 12% confiança do comprador
**Complexidade:** Alta
**Tempo estimado:** 6-7 dias

**Biblioteca sugerida:**
- `react-360-view` ou `@shopify/react-3d-viewer`

---

#### 3.2 Chat de Suporte ao Vivo
**Objetivo:** Responder dúvidas em tempo real

**Opções:**

**A) WhatsApp Widget (Simples):**
- Integrar widget oficial do WhatsApp Business
- Botão flutuante no canto direito
- Horário de atendimento visível

**B) Tawk.to / Crisp (Mais completo):**
- Chat inline no site
- Histórico de conversas
- Notificações no admin
- Gratuito até certo volume

**Impacto:** ↑ 18% conversão
**Complexidade:** Baixa (widget) / Média (chat completo)
**Tempo estimado:** 1-3 dias

---

#### 3.3 Calculadora de Troca (Trade-in)
**Objetivo:** Oferecer desconto para quem tem iPhone usado

**Funcionalidades:**
- Cliente informa modelo do iPhone atual + condição
- Sistema calcula valor de troca (tabela pré-definida)
- Desconto aplicado no novo iPhone
- Mensagem WhatsApp com proposta de troca

**Impacto:** ↑ 25% vendas de seminovos
**Complexidade:** Média
**Tempo estimado:** 4 dias

**Fluxo:**
```
1. Cliente visualiza iPhone 15 Pro Max (R$ 7.999)
2. Clica em "Tenho um iPhone para dar de troca"
3. Seleciona: iPhone 12 Pro 128GB
4. Condição: Bateria 85%, sem arranhões
5. Sistema calcula: Vale R$ 2.500 de desconto
6. Novo preço: R$ 5.499 (pago + troca)
7. [ Enviar Proposta no WhatsApp ]
```

**Tabela de valores:**
```sql
CREATE TABLE valores_trade_in (
  modelo TEXT, -- 'iPhone 12 Pro'
  capacidade TEXT, -- '128GB'
  condicao TEXT, -- 'excelente', 'bom', 'regular'
  valor_min DECIMAL,
  valor_max DECIMAL
);
```

---

#### 3.4 Modo Escuro (Dark Mode)
**Objetivo:** Conforto visual em ambientes com pouca luz

**Funcionalidades:**
- Toggle no header (☀️ / 🌙)
- Persistir preferência em localStorage
- Respeitar preferência do sistema (prefers-color-scheme)
- Todas as páginas adaptadas

**Impacto:** ↑ 8% satisfação de usuário
**Complexidade:** Média
**Tempo estimado:** 3-4 dias

**Já temos as cores no globals.css, basta adicionar:**
```css
[data-theme="dark"] {
  --background: 0 0% 0%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

---

#### 3.5 Timeline de Compra (Guided Selling)
**Objetivo:** Guiar cliente indeciso até a compra

**Funcionalidades:**
- Quiz interativo: "Qual iPhone é ideal para você?"
- Perguntas: Uso (trabalho/jogos/fotos), Orçamento, Bateria mínima
- Resultado: Top 3 recomendações personalizadas
- CTA direto para WhatsApp

**Impacto:** ↑ 20% conversão de indecisos
**Complexidade:** Média
**Tempo estimado:** 5 dias

**Exemplo de perguntas:**
```
1. Qual seu orçamento?
   ○ Até R$ 3.000
   ○ R$ 3.000 - R$ 5.000
   ○ R$ 5.000 - R$ 8.000
   ○ Acima de R$ 8.000

2. Você aceita seminovo?
   ○ Sim, se estiver em ótimo estado
   ○ Prefiro novo

3. O que mais usa no celular?
   ☑ Fotos/vídeos (preciso de câmera boa)
   ☑ Jogos pesados
   ☑ Redes sociais
   ☑ Trabalho/produtividade

4. Bateria é importante?
   ○ Muito (preciso que dure o dia todo)
   ○ Razoável (carrego durante o dia)

→ [ Ver Recomendações ]
```

---

## 4. Integrações Externas

### 🔌 PRIORIDADE MÉDIA

#### 4.1 Gateway de Pagamento (Stripe / Mercado Pago)
**Objetivo:** Permitir compra online sem sair do site

**Funcionalidades:**
- Checkout integrado (cartão, PIX, boleto)
- Parcelamento automático no cartão
- Pagamento via PIX com QR Code
- Confirmação automática de pagamento
- Email de confirmação

**Impacto:** ↑ 35-40% conversão (remove fricção)
**Complexidade:** Alta
**Tempo estimado:** 10-12 dias

**Fluxo sugerido:**
```
1. Cliente adiciona produto ao carrinho
2. Clica em "Finalizar Compra"
3. Preenche dados: nome, CPF, endereço
4. Escolhe método: PIX, Cartão, Boleto
5. Pagamento processado via Stripe/MP
6. Confirmação → Email + SMS
7. Admin recebe notificação de novo pedido
```

**Webhook para sincronizar:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const payload = await req.text()

  const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)

  if (event.type === 'payment_intent.succeeded') {
    // Atualizar pedido como "pago"
    await supabase
      .from('pedidos')
      .update({ status: 'pago', pago_em: new Date() })
      .eq('stripe_payment_id', event.data.object.id)
  }
}
```

---

#### 4.2 Integração com Correios (Cálculo de Frete)
**Objetivo:** Calcular frete automaticamente baseado em CEP

**Funcionalidades:**
- Cliente informa CEP no checkout
- API dos Correios retorna: PAC, SEDEX, prazos, valores
- Exibir opções de frete
- Adicionar ao total do pedido

**Impacto:** ↑ Transparência e confiança
**Complexidade:** Média
**Tempo estimado:** 3-4 dias

**API sugerida:**
- Correios API oficial (necessita credenciais)
- **Alternativa:** Melhor Envio (gratuito até certo volume)

---

#### 4.3 Email Marketing (Mailchimp / Brevo)
**Objetivo:** Nutrir leads e recuperar carrinhos abandonados

**Funcionalidades:**
- Capturar emails de visitantes (popup)
- Criar segmentos: interessados em iPhone 15, seminovos, etc.
- Campanhas automáticas:
  - Boas-vindas (novo cadastro)
  - Produto de interesse voltou ao estoque
  - Desconto no aniversário
  - Produtos recomendados

**Impacto:** ↑ 20% retorno de visitantes
**Complexidade:** Média
**Tempo estimado:** 4-5 dias

**Fluxo de captura:**
```typescript
// Popup após 30s na página
<EmailCapturePopup
  title="Receba ofertas exclusivas"
  subtitle="Cadastre-se e ganhe 5% de desconto na primeira compra"
  onSubmit={async (email) => {
    await fetch('/api/mailchimp/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, source: 'popup' })
    })
  }}
/>
```

---

#### 4.4 Google Shopping / Meta Catalog
**Objetivo:** Anunciar produtos automaticamente

**Funcionalidades:**
- Feed XML/JSON com todos produtos ativos
- Sincronização automática (a cada alteração de produto)
- Meta tags otimizadas para SEO
- Integração com Google Merchant Center

**Impacto:** ↑ 50-70% tráfego orgânico
**Complexidade:** Média
**Tempo estimado:** 3-4 dias

**Feed XML (exemplo):**
```xml
<!-- app/api/feed/google-shopping/route.ts -->
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Léo iPhone</title>
    <item>
      <g:id>IPHONE15PM256</g:id>
      <g:title>iPhone 15 Pro Max 256GB Preto</g:title>
      <g:description>iPhone 15 Pro Max novo com garantia...</g:description>
      <g:link>https://leoiphone.com.br/produto/iphone-15-pro-max-256gb</g:link>
      <g:image_link>https://storage.supabase.co/...</g:image_link>
      <g:price>7999.00 BRL</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
    </item>
  </channel>
</rss>
```

---

#### 4.5 CRM Integrado (Zoho / HubSpot)
**Objetivo:** Gerenciar leads e pipeline de vendas

**Funcionalidades:**
- Todo clique em WhatsApp vira lead no CRM
- Acompanhar estágio: Contato → Negociação → Venda
- Histórico de interações
- Relatórios de conversão por vendedor

**Impacto:** ↑ Organização e follow-up
**Complexidade:** Alta
**Tempo estimado:** 7-8 dias

---

## 5. Analytics e Business Intelligence

### 📊 PRIORIDADE MÉDIA

#### 5.1 Dashboard Avançado de Vendas
**Objetivo:** Visualizar métricas de negócio em tempo real

**Métricas novas:**
- **Faturamento:** Diário, semanal, mensal (gráficos)
- **Produtos mais vendidos:** Top 10 por período
- **Taxa de conversão por categoria:** Qual categoria converte mais?
- **Ticket médio:** Valor médio por venda
- **ROI de anúncios:** Se integrar com Google Ads
- **Funil de conversão:** Visualizações → Cliques WhatsApp → Vendas

**Visualizações:**
- Gráfico de linha (faturamento ao longo do tempo)
- Gráfico de barras (produtos mais vendidos)
- Gráfico de pizza (vendas por categoria)
- Heatmap (dias/horários com mais vendas)

**Complexidade:** Alta
**Tempo estimado:** 8-10 dias

**Biblioteca sugerida:**
- `recharts` (gráficos React nativos)
- `chart.js` + `react-chartjs-2`

---

#### 5.2 Relatórios Exportáveis
**Objetivo:** Gerar relatórios para análise offline

**Tipos de relatórios:**
- Vendas por período (PDF/Excel)
- Estoque atual (CSV)
- Histórico de preços (Excel com gráfico)
- Produtos mais visualizados (PDF)
- Conversões por fonte (Google Analytics integration)

**Complexidade:** Média
**Tempo estimado:** 4-5 dias

---

#### 5.3 Análise de Comportamento de Usuário
**Objetivo:** Entender como visitantes navegam

**Métricas:**
- Páginas mais visitadas
- Tempo médio por página
- Taxa de rejeição (bounce rate)
- Fluxo de navegação (página A → B → C)
- Dispositivo/navegador mais usado

**Ferramentas:**
- **Google Analytics 4** (já integrado via Vercel?)
- **Hotjar** (heatmaps e gravações de sessão)
- **Microsoft Clarity** (gratuito, heatmaps + session replay)

**Complexidade:** Baixa (apenas integração)
**Tempo estimado:** 1-2 dias

---

#### 5.4 A/B Testing de Preços
**Objetivo:** Testar qual preço converte melhor

**Funcionalidades:**
- Criar 2 versões de preço para mesmo produto
- Dividir tráfego 50/50
- Medir qual versão teve mais conversões
- Aplicar vencedor automaticamente

**Complexidade:** Alta
**Tempo estimado:** 6-7 dias

---

## 6. Features de Marketing

### 📢 PRIORIDADE MÉDIA

#### 6.1 Cupons de Desconto
**Objetivo:** Incentivar compras com códigos promocionais

**Funcionalidades:**
- Criar cupons: BEMVINDO10, BLACKFRIDAY20, etc.
- Tipos: Desconto percentual, desconto fixo, frete grátis
- Limites: Uso único por cliente, válido até data X
- Aplicar cupom no checkout
- Rastrear uso de cada cupom

**Tabela:**
```sql
CREATE TABLE cupons (
  id UUID PRIMARY KEY,
  codigo TEXT UNIQUE,
  tipo TEXT, -- 'percentual', 'fixo', 'frete_gratis'
  valor DECIMAL,
  uso_maximo INTEGER,
  uso_atual INTEGER DEFAULT 0,
  valido_ate TIMESTAMP,
  ativo BOOLEAN DEFAULT true
);
```

**Complexidade:** Média
**Tempo estimado:** 4 dias

---

#### 6.2 Programa de Indicação (Referral)
**Objetivo:** Clientes indicam amigos e ganham desconto

**Funcionalidades:**
- Cada cliente tem link único de indicação
- Amigo compra = R$ 100 de desconto para ambos
- Dashboard mostrando quantas indicações cada cliente fez
- Ranking de maiores indicadores

**Fluxo:**
```
1. Cliente João compra iPhone 15
2. Recebe email com link: leoiphone.com.br?ref=JOAO123
3. João compartilha com Maria
4. Maria compra usando o link
5. João ganha R$ 100 de crédito
6. Maria ganha R$ 100 de desconto
```

**Complexidade:** Alta
**Tempo estimado:** 7-8 dias

---

#### 6.3 Reviews e Avaliações Públicas
**Objetivo:** Mostrar avaliações de clientes reais

**Funcionalidades:**
- Após compra, enviar email pedindo avaliação
- Cliente avalia: 1-5 estrelas + comentário
- Admin aprova antes de publicar
- Exibir média de estrelas em cada produto
- Filtrar por quantidade de estrelas

**Impacto:** ↑ 25% confiança
**Complexidade:** Média
**Tempo estimado:** 5 dias

**Estrutura já existe (`avaliacoes` table), só falta:**
- ✅ Formulário de avaliação (já existe no admin)
- ❌ Exibir avaliações na página do produto
- ❌ Email automático pós-compra

---

#### 6.4 Blog de Conteúdo (SEO)
**Objetivo:** Atrair tráfego orgânico via conteúdo

**Exemplos de posts:**
- "iPhone 15 vs iPhone 14: Vale a pena o upgrade?"
- "Como identificar um iPhone original?"
- "5 dicas para aumentar a bateria do seu iPhone"
- "Qual a diferença entre iPhone novo e seminovo?"

**Funcionalidades:**
- CMS simples no admin (criar/editar posts)
- Posts em Markdown ou Rich Text
- Tags e categorias
- SEO otimizado (meta tags, sitemap)

**Impacto:** ↑ 40-60% tráfego orgânico
**Complexidade:** Média-Alta
**Tempo estimado:** 8-10 dias

---

#### 6.5 Notificações Push (PWA)
**Objetivo:** Re-engajar visitantes que instalaram o PWA

**Funcionalidades:**
- Solicitar permissão para notificações
- Enviar notificações: "iPhone 15 baixou de preço!"
- Segmentar por interesse (modelo preferido)
- Agendar campanhas de notificação

**Impacto:** ↑ 15% retorno de visitantes
**Complexidade:** Média
**Tempo estimado:** 4-5 dias

**Biblioteca:**
- `web-push` (Node.js)
- Firebase Cloud Messaging (FCM)

---

## 7. Melhorias Técnicas e Performance

### ⚙️ PRIORIDADE BAIXA-MÉDIA

#### 7.1 Cache Otimizado com Redis
**Objetivo:** Reduzir carga no Supabase

**O que cachear:**
- Lista de produtos (cache de 1 minuto)
- Categorias (cache de 1 hora)
- Taxas de parcelamento (cache de 5 minutos)
- Dashboard analytics (cache de 30 segundos)

**Impacto:** ↓ 70-80% queries ao banco
**Complexidade:** Alta
**Tempo estimado:** 5-6 dias

**Implementação (Upstash Redis):**
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
})

export async function getProdutos() {
  const cached = await redis.get('produtos:ativos')
  if (cached) return cached

  const produtos = await supabase.from('produtos').select('*')
  await redis.set('produtos:ativos', produtos, { ex: 60 }) // 1 min

  return produtos
}
```

---

#### 7.2 Image CDN e WebP/AVIF Conversion
**Objetivo:** Servir imagens mais rápido

**Atualmente:** Supabase Storage (bom, mas pode ser otimizado)

**Melhoria:**
- Integrar com Cloudflare Images ou Imgix
- Conversão automática para WebP/AVIF
- Resize on-the-fly (múltiplos tamanhos)
- Cache agressivo (1 ano)

**Impacto:** ↓ 60% tamanho das imagens, ↑ 40% velocidade
**Complexidade:** Média
**Tempo estimado:** 3 dias

---

#### 7.3 Preload de Dados Críticos
**Objetivo:** Reduzir tempo de carregamento inicial

**Técnicas:**
- Prefetch de produtos no hover do card
- Preconnect para Supabase e CDNs
- Preload de fontes
- Service Worker inteligente

**Complexidade:** Baixa
**Tempo estimado:** 2 dias

---

#### 7.4 Monitoramento de Erros (Sentry)
**Objetivo:** Detectar bugs antes que clientes reportem

**Funcionalidades:**
- Rastreamento automático de erros
- Stack traces completos
- Contexto do usuário (página, ação, device)
- Alertas por email/Slack
- Dashboard de erros mais frequentes

**Complexidade:** Baixa
**Tempo estimado:** 1 dia

---

#### 7.5 Testes Automatizados
**Objetivo:** Prevenir regressões

**Tipos de testes:**
- **Unit:** Funções utilitárias (calcular-parcelas.ts)
- **Integration:** Server Actions (criar produto, etc.)
- **E2E:** Fluxo completo (pesquisar → abrir produto → WhatsApp)

**Ferramentas:**
- Vitest (unit/integration)
- Playwright (E2E)

**Complexidade:** Alta
**Tempo estimado:** 10-12 dias (setup + cobertura 70%)

---

## 8. Features Mobile-First

### 📱 PRIORIDADE BAIXA

#### 8.1 App Nativo (React Native / Capacitor)
**Objetivo:** Estar nas lojas de apps (iOS/Android)

**Vantagens:**
- Notificações push nativas
- Melhor performance
- Presença nas app stores
- Offline-first

**Complexidade:** Muito Alta
**Tempo estimado:** 30-40 dias

---

#### 8.2 Pesquisa por Voz
**Objetivo:** Facilitar busca em dispositivos móveis

**Funcionalidades:**
- Botão 🎤 na barra de pesquisa
- Web Speech API
- Reconhecimento: "iPhone 15 Pro Max 256 gigas"
- Busca automática após falar

**Complexidade:** Baixa-Média
**Tempo estimado:** 2 dias

---

#### 8.3 Câmera para Escanear QR Code
**Objetivo:** Promoções offline → online

**Caso de uso:**
- Cliente vê QR Code em anúncio físico
- Escaneia com câmera do site
- Redirecionado para produto com desconto especial

**Complexidade:** Média
**Tempo estimado:** 3 dias

---

## 9. Recursos Comunitários e Social

### 👥 PRIORIDADE BAIXA

#### 9.1 Galeria de Fotos de Clientes
**Objetivo:** Prova social (clientes reais com produtos)

**Funcionalidades:**
- Clientes enviam foto com iPhone comprado
- Admin aprova e publica
- Galeria na homepage: "Nossos clientes"
- Link para produto comprado

**Impacto:** ↑ 10% confiança
**Complexidade:** Baixa
**Tempo estimado:** 2 dias

---

#### 9.2 FAQ Interativo
**Objetivo:** Responder dúvidas comuns

**Perguntas comuns:**
- "Qual a diferença entre novo e seminovo?"
- "Como funciona a garantia?"
- "Posso parcelar no boleto?"
- "Vocês aceitam troca?"
- "Entregam em qual região?"

**Funcionalidades:**
- Accordion expansível
- Busca no FAQ
- CMS no admin para editar perguntas

**Complexidade:** Baixa
**Tempo estimado:** 2 dias

---

#### 9.3 Comparador de Operadoras (Planos)
**Objetivo:** Ajudar cliente a escolher plano

**Funcionalidades:**
- Após escolher iPhone, sugerir planos de operadoras
- Comparar: Claro, Vivo, TIM, Oi
- Preço do plano + aparelho
- Link de afiliado (ganhar comissão)

**Complexidade:** Média
**Tempo estimado:** 4 dias

---

## 10. Automação de Processos

### 🤖 PRIORIDADE BAIXA

#### 10.1 Sincronização com Estoque Físico
**Objetivo:** Evitar vender produto sem estoque

**Funcionalidades:**
- Integração com sistema de estoque (se existir)
- Atualização automática via API
- Desativar produto quando estoque = 0
- Notificar admin quando estoque baixo

**Complexidade:** Alta (depende do sistema)
**Tempo estimado:** Variável

---

#### 10.2 Geração Automática de Nota Fiscal
**Objetivo:** Automatizar emissão de NF-e

**Integração:**
- Tiny ERP
- Bling
- Omie

**Fluxo:**
```
Venda confirmada → Criar pedido no ERP → Gerar NF-e → Enviar por email
```

**Complexidade:** Alta
**Tempo estimado:** 10-12 dias

---

#### 10.3 Chatbot Básico (IA)
**Objetivo:** Responder perguntas simples automaticamente

**Funcionalidades:**
- Integrar com OpenAI API ou Anthropic Claude
- Treinar com FAQ e informações de produtos
- Responder: "Qual o preço do iPhone 15 Pro?"
- Encaminhar para humano se não souber

**Complexidade:** Alta
**Tempo estimado:** 8-10 dias

---

#### 10.4 Reabastecimento Automático
**Objetivo:** Sugerir compra de estoque baseado em vendas

**Funcionalidades:**
- Analisar histórico de vendas
- Prever demanda futura (machine learning básico)
- Sugerir: "Reabastecer iPhone 14 Pro 128GB (vendendo 5/dia)"

**Complexidade:** Muito Alta
**Tempo estimado:** 15-20 dias

---

## 📊 Priorização Sugerida

### Sprint 1 (2 semanas) - Quick Wins
1. ✅ Filtros Avançados de Busca
2. ✅ Sistema de Favoritos
3. ✅ Duplicação Rápida de Produtos
4. ✅ FAQ Interativo
5. ✅ Chat de Suporte (widget WhatsApp)

### Sprint 2 (3 semanas) - Conversão
1. ✅ Comparador de Produtos
2. ✅ Sistema de Notificações de Preço
3. ✅ Reviews Públicas
4. ✅ Templates de Descrição

### Sprint 3 (4 semanas) - Automação
1. ✅ Importação/Exportação CSV
2. ✅ Agendamento de Promoções
3. ✅ Histórico de Alterações
4. ✅ Cupons de Desconto

### Sprint 4 (5 semanas) - Growth
1. ✅ Gateway de Pagamento
2. ✅ Google Shopping Feed
3. ✅ Email Marketing
4. ✅ Dashboard Avançado

### Sprint 5 (3 semanas) - Experiência
1. ✅ Modo Escuro
2. ✅ "Compre Junto" Bundles
3. ✅ Calculadora de Troca
4. ✅ Visualização 360°

---

## 🎯 ROI Estimado por Feature

| Feature | Complexidade | Tempo | Impacto Conversão | ROI |
|---------|--------------|-------|-------------------|-----|
| Notificações de Preço | Média | 5d | +25-30% | ⭐⭐⭐⭐⭐ |
| Gateway de Pagamento | Alta | 12d | +35-40% | ⭐⭐⭐⭐⭐ |
| Comparador de Produtos | Média | 4d | +15-20% | ⭐⭐⭐⭐ |
| Filtros Avançados | Média | 4d | +30% satisfação | ⭐⭐⭐⭐ |
| Reviews Públicas | Média | 5d | +25% confiança | ⭐⭐⭐⭐ |
| Sistema de Favoritos | Baixa | 3d | +20% retorno | ⭐⭐⭐⭐ |
| Importação CSV | Alta | 7d | -80% tempo admin | ⭐⭐⭐⭐ |
| Chat Suporte | Baixa | 2d | +18% conversão | ⭐⭐⭐⭐ |
| Cupons de Desconto | Média | 4d | +15% vendas | ⭐⭐⭐ |
| "Compre Junto" | Média | 5d | +10-15% ticket | ⭐⭐⭐ |
| Modo Escuro | Média | 4d | +8% satisfação | ⭐⭐ |
| App Nativo | Muito Alta | 40d | +20% engajamento | ⭐⭐ |

---

## 🛠 Tecnologias Recomendadas

### Pagamentos
- **Stripe** (melhor para internacional)
- **Mercado Pago** (melhor para Brasil - PIX)
- **Asaas** (alternativa brasileira)

### Email Marketing
- **Brevo (ex-Sendinblue)** - Gratuito até 300 emails/dia
- **Mailchimp** - Gratuito até 500 contatos
- **ConvertKit** - Foco em creators

### Analytics
- **Microsoft Clarity** - Gratuito, heatmaps + session replay
- **Hotjar** - Heatmaps + feedback surveys
- **PostHog** - Open-source, self-hosted

### CRM
- **HubSpot** - Gratuito até 1M contatos
- **Zoho CRM** - Plano gratuito
- **Pipedrive** - Melhor UX, pago

### Monitoramento
- **Sentry** - Error tracking (gratuito até 5k eventos/mês)
- **LogRocket** - Session replay + logs
- **Datadog** - APM completo (pago)

### Cache
- **Upstash Redis** - Serverless Redis (gratuito até 10k requests/dia)
- **Vercel KV** - Redis by Vercel

### Testes
- **Vitest** - Unit/Integration (rápido, compatível com Vite)
- **Playwright** - E2E (melhor DX)

---

## 📝 Conclusão

Este documento apresenta **40+ ideias** de melhorias para o Léo iPhone, organizadas por:
- **Impacto no negócio** (conversão, produtividade, satisfação)
- **Complexidade técnica** (baixa, média, alta)
- **Tempo estimado de desenvolvimento**
- **ROI esperado**

### Recomendação Final

Se você pudesse implementar apenas **5 features** no próximo mês, eu escolheria:

1. **Notificações de Preço** - Maior captura de leads (+25%)
2. **Comparador de Produtos** - Reduz indecisão (+15-20%)
3. **Filtros Avançados** - Melhora descoberta (+30% satisfação)
4. **Importação CSV** - Economiza 80% do tempo admin
5. **Reviews Públicas** - Aumenta confiança (+25%)

Todas são viáveis em 3-4 semanas de desenvolvimento e têm impacto mensurável.

---

**Documento criado em:** 30 de Outubro de 2025
**Análise baseada em:** Codebase completo do projeto (Next.js 16 + Supabase)
**Status:** Pronto para discussão e priorização 🚀
