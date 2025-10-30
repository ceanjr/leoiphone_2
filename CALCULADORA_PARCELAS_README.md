# 💳 Calculadora de Parcelas - Guia de Uso

## 📦 O que foi implementado

Sistema completo de calculadora de parcelas com taxa de juros configurável pelo admin.

---

## 🚀 Como usar

### 1️⃣ **Executar a Migration no Supabase**

Existem **3 versões** da migration. Escolha uma:

#### **Opção A: SEM RLS (Recomendado - Mais Simples)** ✅
```bash
# Use se suas rotas /admin/* já estão protegidas
supabase-migration-taxas-sem-rls.sql
```
- ✅ Mais simples
- ✅ Funciona imediatamente
- ⚠️ Sem RLS (confie na proteção de rotas)

#### **Opção B: COM RLS Básico**
```bash
# Permite qualquer usuário autenticado modificar
supabase-migration-taxas-simples.sql
```
- ✅ RLS habilitado
- ✅ Leitura pública permitida
- ✅ Modificação apenas para usuários autenticados

#### **Opção C: COM RLS Avançado** (Requer tabela admin_users)
```bash
# Use se você tem tabela de controle de admins
supabase-migration-taxas.sql
```
- ✅ RLS completo
- ❌ Requer tabela `admin_users`
- 🔧 Ajuste a policy conforme seu sistema

---

**Como executar:**
1. Acesse o **SQL Editor** do Supabase
2. Escolha um dos arquivos acima
3. Copie e execute todo o conteúdo
4. Verifique se funcionou:
   ```sql
   SELECT * FROM configuracoes_taxas;
   ```

Você verá uma linha com a configuração padrão (ativa = false).

---

### 2️⃣ **Configurar as Taxas (Admin)**

1. Acesse: **`/admin/taxas`**
2. Você verá:
   - **Toggle ON/OFF** para ativar a calculadora
   - **Grid de inputs** com taxas de 1x até 18x
   - **Preview em tempo real** mostrando exemplo

3. **Configure as taxas:**
   - 1x = 0% (sem juros)
   - 2x = 1.6%
   - 3x = 2.5%
   - ... (valores já vêm pré-configurados)

4. **Ative o toggle** para exibir no site público

5. **Clique em "Salvar Configurações"**

---

### 3️⃣ **Visualizar no Site (Cliente)**

1. Acesse uma página de produto: `/produto/[slug]`
2. **Se a calculadora estiver ativa**, você verá abaixo do preço:

```
┌─────────────────────────────────────┐
│ 💳 em até 18x de R$ 156,89         │
│ Ver todas as parcelas ▼            │
└─────────────────────────────────────┘
```

3. **Clique para expandir** e ver todas as 18 opções
4. A parcela **1x** (sem juros) aparece destacada em verde

---

## 📁 Arquivos Criados

### Backend & Lógica
- `supabase-migration-taxas.sql` - Migration da tabela
- `lib/validations/taxas.ts` - Schema Zod + tipos TypeScript
- `lib/utils/calcular-parcelas.ts` - Funções de cálculo
- `app/admin/taxas/actions.ts` - Server Actions (CRUD)

### Frontend
- `app/admin/taxas/page.tsx` - Interface de configuração
- `components/public/calculadora-parcelas.tsx` - Componente público
- `app/(public)/produto/[slug]/page.tsx` - ✨ Integrado aqui

---

## 🔧 Funcionalidades

### Administração
✅ Toggle para ativar/desativar
✅ Editor de taxas com validação (0% a 50%)
✅ Preview em tempo real
✅ Botão "Restaurar Padrões"
✅ Feedback visual de mudanças não salvas
✅ Toasts de sucesso/erro

### Página do Produto
✅ Mostra apenas se ativo no admin
✅ Mini-tabela colapsável/expansível
✅ Animação suave
✅ Destaque visual na parcela sem juros
✅ Formatação monetária em Real (R$)
✅ Responsive (desktop e mobile)
✅ Acessibilidade (aria-labels)

---

## 🎨 Design

- Segue o design system existente (cores zinc-xxx)
- Usa `var(--brand-yellow)` para highlights
- Componentes shadcn/ui
- Animações Tailwind

---

## 📊 Exemplo de Cálculo

**Produto: R$ 2.800,00**

| Parcelas | Taxa  | Valor por Parcela | Total com Juros |
|----------|-------|-------------------|-----------------|
| 1x       | 0%    | R$ 2.800,00       | R$ 2.800,00     |
| 2x       | 1.6%  | R$ 1.422,40       | R$ 2.844,80     |
| 12x      | 10.3% | R$ 257,03         | R$ 3.084,40     |
| 18x      | 16.6% | R$ 180,91         | R$ 3.256,40     |

**Fórmula:** `parcela = (preco * (1 + taxa/100)) / numero_parcelas`

---

## ⚡ Performance

- **Lazy loading** do componente (só carrega ao expandir)
- **Memoização** de cálculos (React useMemo)
- **Cache** do Supabase (revalidação a cada 1 hora)
- **Server-side** busca de configurações

---

## 🔐 Segurança

- **RLS** habilitado na tabela
- Leitura pública permitida (para frontend)
- Modificação apenas para admins
- Validação Zod no server e client

---

## 🧪 Como Testar

### Teste 1: Configuração Admin
```
1. Acesse /admin/taxas
2. Altere taxa do 2x de 1.6% para 2.0%
3. Salve
4. Verifique o toast de sucesso
```

### Teste 2: Visualização Pública
```
1. Ative o toggle em /admin/taxas
2. Salve
3. Acesse um produto (ex: /produto/iphone-15-pro-max)
4. Veja a calculadora aparecer abaixo do preço
5. Clique para expandir
6. Verifique os valores calculados
```

### Teste 3: Toggle OFF
```
1. Desative o toggle em /admin/taxas
2. Salve
3. Recarregue a página do produto
4. A calculadora deve DESAPARECER
```

---

## 🐛 Troubleshooting

### Calculadora não aparece no produto
- ✅ Verifique se o toggle está **ativo** em `/admin/taxas`
- ✅ Execute a migration SQL
- ✅ Limpe o cache do navegador (Ctrl+Shift+R)

### Erro ao salvar configurações
- ✅ Verifique as políticas RLS no Supabase
- ✅ Confirme que você está autenticado como admin
- ✅ Veja os logs no console do navegador

### Valores estranhos no cálculo
- ✅ Verifique se as taxas estão entre 0% e 50%
- ✅ Restaure os padrões e teste novamente

---

## 📝 Notas Importantes

1. **Migration obrigatória**: Execute o SQL antes de usar
2. **RLS**: Ajuste as policies se sua autenticação for diferente
3. **Cache**: Mudanças podem levar até 1 minuto para aparecer (revalidação)
4. **Taxas**: São porcentagens (ex: 1.6 = 1.6%, não 160%)

---

## 🎯 Próximas Melhorias (Opcional)

- [ ] Histórico de mudanças de taxas (auditoria)
- [ ] Diferentes sets de taxas por categoria de produto
- [ ] Simulador com desconto à vista
- [ ] Export/Import de configurações
- [ ] Analytics de qual parcela é mais escolhida

---

## ✅ Checklist de Deploy

- [ ] Migration SQL executada no Supabase
- [ ] RLS policies configuradas corretamente
- [ ] Configuração padrão testada
- [ ] Toggle ativado no admin
- [ ] Calculadora aparecendo em produtos
- [ ] Testado em mobile e desktop
- [ ] Cache limpo após deploy

---

**Implementado com ❤️ seguindo o design system do Leo iPhone**
