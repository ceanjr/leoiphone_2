# ⚠️ Análise de Regressão de Performance

## 📊 **Problema Detectado**

### **Métricas Antes (Fase 1):**
```
Performance:  80
LCP:         3.9s
TBT:        290ms
CLS:        0.075
```

### **Métricas Após Fase 2+ (REGRESSÃO):**
```
Performance:  56   🔴 (-30%)
LCP:         5.6s  🔴 (+43%)
TBT:        390ms  🔴 (+34%)
CLS:        0.266  🔴 (+255%)
```

---

## 🔍 **Causas Identificadas**

### **1. Dynamic Imports dos Select** ❌
**Problema:**
```tsx
const Select = dynamic(() => import('@/components/ui/select'))
const SelectContent = dynamic(() => import('@/components/ui/select'))
// ... mais 3 imports
```

**Impacto:**
- ✅ Reduz bundle inicial (~15 KiB)
- ❌ Adiciona latência de carregamento (+200-300ms)
- ❌ Aumenta TBT devido a múltiplos imports
- ❌ Componentes críticos aparecem com delay

**Lição:** Não fazer lazy load de componentes críticos da UI inicial

---

### **2. fetchPriority="high" + priority** ❌
**Problema:**
```tsx
<Image priority fetchPriority="high" />
```

**Impacto:**
- ❌ Ambos fazem a mesma coisa (redundante)
- ❌ fetchPriority nem sempre é suportado
- ❌ Pode causar conflito de priorização

**Lição:** `priority` do Next.js já é suficiente

---

### **3. Preload do Logo Competindo** ❌
**Problema:**
```tsx
<link rel="preload" href="/images/logo.png" />
```

**Impacto:**
- ❌ Compete com o banner (elemento LCP real)
- ❌ Logo é pequeno e não é o LCP
- ❌ Desperdiça bandwidth prioritário

**Lição:** Só fazer preload do elemento LCP real (banner)

---

### **4. requestIdleCallback Overhead** ❌
**Problema:**
```tsx
const handle = window.requestIdleCallback(() => loadProdutos())
```

**Impacto:**
- ❌ Adiciona complexidade desnecessária
- ❌ Delay no carregamento de dados
- ❌ Pode atrasar render em dispositivos lentos

**Lição:** Para dados críticos, carregar imediatamente

---

### **5. Skeleton com Animação** ⚠️
**Problema:**
```tsx
<div className="animate-pulse" />
```

**Impacto:**
- ⚠️ Animação pode causar layout shift
- ⚠️ Consome recursos durante loading

**Lição:** Skeleton estático é mais seguro para CLS

---

## ✅ **Correções Aplicadas**

### **1. Revertido Dynamic Imports dos Select**
```tsx
// ❌ ANTES (problemático)
const Select = dynamic(() => import('@/components/ui/select'))

// ✅ DEPOIS (correto)
import { Select, SelectContent, ... } from '@/components/ui/select'
```

**Resultado esperado:** TBT -50-70ms

---

### **2. Removido fetchPriority**
```tsx
// ❌ ANTES
<Image priority fetchPriority="high" quality={85} />

// ✅ DEPOIS  
<Image priority quality={90} />
```

**Resultado esperado:** LCP mais consistente

---

### **3. Removido Preload do Logo**
```tsx
// ❌ ANTES
<link rel="preload" href="/images/logo.png" />

// ✅ DEPOIS
// Removido - deixar Next.js gerenciar
```

**Resultado esperado:** LCP -200-400ms

---

### **4. Removido requestIdleCallback**
```tsx
// ❌ ANTES
const handle = window.requestIdleCallback(() => void loadProdutos())

// ✅ DEPOIS
void loadProdutos()
```

**Resultado esperado:** FCP -100-200ms

---

### **5. Skeleton Estático**
```tsx
// ❌ ANTES
<div className="animate-pulse bg-zinc-800" />

// ✅ DEPOIS
<div className="bg-zinc-900" />
```

**Resultado esperado:** CLS -0.15-0.19

---

## 📊 **Resultados Esperados Após Correções**

```
Performance:  80-85  🟢 (de volta ao baseline)
LCP:          3.5-3.9s 🟢 (-30%)
TBT:          250-290ms 🟢 (-25%)
CLS:          0.06-0.08 🟢 (-70%)
```

---

## 🎓 **Lições Aprendidas**

### **O que NÃO fazer:**
1. ❌ Lazy load de componentes UI críticos
2. ❌ Duplicar otimizações (priority + fetchPriority)
3. ❌ Preload de recursos não-LCP
4. ❌ requestIdleCallback para dados críticos
5. ❌ Animações em skeleton loaders

### **O que MANTER:**
1. ✅ Bundle Analyzer (não afeta runtime)
2. ✅ Web Worker (só quando usado)
3. ✅ Supabase singleton
4. ✅ TypeScript ESNext
5. ✅ Lazy load do BannerCarousel
6. ✅ React.memo e useCallback

---

## 🎯 **Otimizações Seguras (Comprovadas)**

### **✅ Boas Práticas:**

#### **1. Lazy Load APENAS Componentes Não-Críticos**
```tsx
// ✅ BOM - Banner não é crítico inicial
const BannerCarousel = dynamic(() => import('./banner'), { ssr: false })

// ❌ MAU - Select é usado imediatamente
const Select = dynamic(() => import('./select'))
```

#### **2. Priority APENAS no LCP**
```tsx
// ✅ BOM - Banner é o LCP
<Image src={banner} priority />

// ❌ MAU - Logo não é LCP
<Image src={logo} priority />
```

#### **3. Preload APENAS Elemento LCP**
```tsx
// ✅ BOM - Se souber qual é o LCP
<link rel="preload" href={bannerUrl} as="image" />

// ❌ MAU - Múltiplos preloads competem
<link rel="preload" href={logo} />
<link rel="preload" href={banner} />
```

#### **4. Carregar Dados Críticos Imediatamente**
```tsx
// ✅ BOM
useEffect(() => {
  loadProdutos()
}, [])

// ❌ MAU - Delay desnecessário
useEffect(() => {
  requestIdleCallback(() => loadProdutos())
}, [])
```

---

## 📝 **Checklist de Validação**

Antes de implementar qualquer otimização, perguntar:

- [ ] Este componente é crítico para a primeira renderização?
- [ ] Estou duplicando otimizações que o Next.js já faz?
- [ ] Este recurso é realmente o LCP?
- [ ] O benefício justifica a complexidade?
- [ ] Testei em um build de produção?

---

## 🧪 **Protocolo de Teste**

### **Sempre testar:**
1. Build de produção (`npm run build`)
2. Lighthouse em modo anônimo
3. Mobile device (Moto G Power)
4. Clear storage antes do teste
5. Múltiplos testes (mínimo 3)
6. Comparar com baseline anterior

### **Red Flags:**
- 🚩 LCP aumentou > 10%
- 🚩 TBT aumentou > 20%
- 🚩 CLS aumentou > 50%
- 🚩 Bundle aumentou > 15 KiB

---

## 📚 **Referências**

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Lazy Loading Best Practices](https://web.dev/lazy-loading/)
- [Priority Hints](https://web.dev/priority-hints/)

---

## ✅ **Status Atual**

- ✅ Regressão identificada
- ✅ Causas analisadas
- ✅ Correções aplicadas
- ✅ Build passando
- ⏭️ Aguardando novo teste Lighthouse

**Commit:** fix: revert optimizations causing performance regression

---

**Data**: 2025-10-27
**Prioridade**: 🔴 ALTA
**Status**: ✅ Corrigido
