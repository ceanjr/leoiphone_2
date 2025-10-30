# Prompt para Implementação da Calculadora de Taxas de Parcelamento

Preciso implementar uma **calculadora de taxas de parcelamento** no catálogo Leo iPhone. A solução deve incluir:

## 1. Página de Administração (`/admin/taxas`)

### Funcionalidades:
- **Toggle para ativar/desativar** a exibição da calculadora no site público
- **Editor inteligente de taxas** com os seguintes valores padrão:
```json
{
  "1x": 0.00,
  "2x": 1.60,
  "3x": 2.50,
  "4x": 3.30,
  "5x": 4.10,
  "6x": 4.90,
  "7x": 5.80,
  "8x": 6.70,
  "9x": 7.60,
  "10x": 8.50,
  "11x": 9.40,
  "12x": 10.30,
  "13x": 12.10,
  "14x": 13.00,
  "15x": 13.90,
  "16x": 14.80,
  "17x": 15.70,
  "18x": 16.60
}
```

### Interface do Editor:
- Grid responsivo com inputs numéricos para cada parcela
- Validação: taxas entre 0% e 50%
- Preview em tempo real mostrando exemplo de cálculo
- Botão "Restaurar Padrões"
- Indicador visual de alterações não salvas
- Confirmação antes de salvar

### Persistência:
- Armazenar configurações no Supabase (criar tabela `configuracoes_taxas`)
- Cache no client-side para performance
- Fallback para valores padrão se não houver configuração

## 2. Componente na Página do Produto (`/produto/[slug]`)

### Layout Sugerido (Mini-tabela Expansível):
```
┌─────────────────────────────────────┐
│ 💳 em até 18x de R$ 156,89         │
│ [Ver todas as parcelas ▼]          │
└─────────────────────────────────────┘

(Ao expandir)
┌─────────────────────────────────────┐
│ 💳 Opções de Parcelamento          │
│ ───────────────────────────────────│
│ 1x  R$ 2.800,00  sem juros         │
│ 2x  R$ 1.422,40  (1,6% a.m.)      │
│ 3x  R$ 956,67   (2,5% a.m.)       │
│ ...                                 │
│ 18x R$ 156,89   (16,6% a.m.)      │
│ [Fechar ▲]                         │
└─────────────────────────────────────┘
```

### Comportamento:
- Só exibir se a funcionalidade estiver **ativada no admin**
- Calcular automaticamente baseado no preço do produto
- Destacar visualmente a parcela sem juros (1x)
- Animação suave de expansão/colapso
- Responsive: em mobile, mostrar em modal fullscreen
- Ícone de cartão de crédito para identificação rápida

### Cálculo das Parcelas:
```typescript
parcela = (preco_produto * (1 + taxa/100)) / numero_parcelas
```

## 3. Alternativas de Layout (além da mini-tabela)

### Opção A: Badge com Popover
```
[💳 Ver parcelamento]  ← Badge clicável
     ↓
  (Popover flutua sobre o conteúdo)
```

### Opção B: Accordion Integrado
```
┌─────────────────────────────────────┐
│ Preço: R$ 2.800,00                 │
│                                     │
│ ▶ Opções de Parcelamento           │
└─────────────────────────────────────┘
```

### Opção C: Botão com Dialog
```
[Simular Parcelamento] ← Botão secundário
     ↓
  (Dialog/Modal centralizado)
```

**Recomendo a mini-tabela expansível** por ser mais elegante e não ocupar espaço desnecessário.

## 4. Requisitos Técnicos

### Stack:
- **Frontend**: React Server Components + Client Components (onde necessário)
- **UI**: shadcn/ui (Dialog, Accordion, Badge, Input, Switch, Label)
- **Validação**: Zod schema para taxas
- **Estado**: Server Actions para persistência
- **Estilo**: Tailwind CSS mantendo consistência com design existente

### Estrutura de Arquivos:
```
app/
├── admin/
│   └── taxas/
│       ├── page.tsx          # Interface de configuração
│       └── actions.ts        # Server actions (CRUD taxas)
├── (public)/
│   └── produto/[slug]/
│       └── page.tsx          # Adicionar calculadora aqui
├── components/
│   └── public/
│       └── calculadora-parcelas.tsx  # Componente reutilizável
lib/
├── validations/
│   └── taxas.ts              # Schema de validação Zod
└── utils/
    └── calcular-parcelas.ts  # Lógica de cálculo

supabase/ (ou migrations)
└── create_configuracoes_taxas.sql  # DDL da tabela
```

### Schema Supabase (tabela `configuracoes_taxas`):
```sql
CREATE TABLE configuracoes_taxas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ativo BOOLEAN NOT NULL DEFAULT false,
  taxas JSONB NOT NULL DEFAULT '{"1x": 0.00, "2x": 1.60, "3x": 2.50, "4x": 3.30, "5x": 4.10, "6x": 4.90, "7x": 5.80, "8x": 6.70, "9x": 7.60, "10x": 8.50, "11x": 9.40, "12x": 10.30, "13x": 12.10, "14x": 13.00, "15x": 13.90, "16x": 14.80, "17x": 15.70, "18x": 16.60}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE configuracoes_taxas ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode LER (para exibir no frontend)
CREATE POLICY "Permitir leitura pública" ON configuracoes_taxas
  FOR SELECT USING (true);

-- Apenas admins podem MODIFICAR
CREATE POLICY "Apenas admins podem modificar" ON configuracoes_taxas
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );

-- Índice para performance
CREATE INDEX idx_configuracoes_taxas_ativo ON configuracoes_taxas(ativo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_taxas_updated_at
  BEFORE UPDATE ON configuracoes_taxas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 5. Detalhes de UX

### Página do Produto:
- Posicionar **abaixo do preço principal**, antes dos botões de CTA
- Usar cor `var(--brand-yellow)` para highlights
- Transições suaves (150-200ms)
- Loading state enquanto busca taxas

### Admin:
- Feedback visual ao salvar (toast success/error)
- Desabilitar inputs se toggle estiver OFF
- Tooltip explicando cada campo
- Logs de auditoria (quem alterou, quando)

## 6. Considerações de Performance

- **Memoização**: `useMemo` para cálculos de parcelas
- **Server-side**: Buscar configurações no servidor (não expor API)
- **Cache**: Revalidar a cada 1 hora (`revalidate: 3600`)
- **Lazy load**: Componente da calculadora só carrega ao expandir

## 7. Acessibilidade

- `aria-expanded` no botão de toggle
- `role="region"` na área expansível
- Focus trap no modal (mobile)
- Labels semânticos para inputs

---

**Nota importante**: Mantenha a consistência com o design system existente (cores zinc-xxx, border-zinc-800, bg-zinc-950, etc). Use os componentes do shadcn/ui já presentes no projeto.

**Prioridade de implementação**:
1. Estrutura da tabela Supabase + Server Actions
2. Página `/admin/taxas` com editor
3. Componente `calculadora-parcelas.tsx`
4. Integração na página do produto
5. Testes e refinamentos de UX

Pode começar a implementação seguindo essa ordem?