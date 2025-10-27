Você é uma IA especialista em otimização de projetos Next.js + Supabase, com foco em performance web, Core Web Vitals e boas práticas de UI.  
Abaixo está o contexto e as instruções do que deve ser feito no código existente.

---

## 🧱 CONTEXTO DO PROJETO
- Projeto: catálogo com dashboard (Next.js + Supabase)
- Deploy: Vercel
- Stack: React, Tailwind, shadcn/ui, Supabase client
- Framework: Next.js 14+ (App Router)

O Lighthouse indicou:
- Desempenho: 59
- Acessibilidade: 90
- Boas práticas: 100
- SEO: 100

Principais métricas:
- FCP: 1.1s
- LCP: 4.2s
- TBT: 170ms
- CLS: 1.047
- JS não usado: 174 KiB
- Tempo na thread principal: 3.2s

---

## 🎯 OBJETIVO
Melhorar **performance** sem quebrar o design ou o comportamento atual.  
Atingir pontuação de **90+ em Lighthouse**, reduzindo LCP, TBT, JS não usado e deslocamento visual (CLS).

---

## 🪄 AÇÕES PARA IMPLEMENTAR AUTOMATICAMENTE

### 🔹 1. IMAGENS
- Converter todas as imagens para formato moderno (`.webp` ou `.avif`).
- Substituir `<img>` por `<Image>` do Next.js.
- Adicionar `width`, `height` e `loading="lazy"` a todas.
- Configurar `priority` apenas na imagem principal da página.
- Implementar `sizes` responsivos no componente `<Image>` (ex: `sizes="(max-width: 768px) 100vw, 50vw"`).
- Adicionar `preload` no LCP (`<link rel="preload" as="image" href="..." />` no layout).

---

### 🔹 2. LCP (Largest Contentful Paint)
- Priorizar renderização do hero/banner ou elemento LCP.
- Mover scripts não críticos para `defer` ou `next/script` com `strategy="afterInteractive"`.
- Adicionar `font-display: swap` nas fontes customizadas.

---

### 🔹 3. REDUÇÃO DE JAVASCRIPT
- Remover código e dependências não usadas.
- Substituir libs pesadas (`moment.js`, `lodash`) por versões leves (`date-fns`, utilitários locais).
- Implementar lazy loading para componentes não críticos (`dynamic(() => import('...'))`).
- Dividir grandes componentes em partes menores com **code splitting**.
- Reduzir re-renderizações desnecessárias com `useMemo`, `useCallback` e `React.memo`.

---

### 🔹 4. TBT (Total Blocking Time)
- Evitar tarefas longas: refatorar loops e funções síncronas pesadas.
- Usar `requestIdleCallback()` ou `useEffect` diferido para cálculos não críticos.
- Adiar inicializações Supabase pesadas até o usuário interagir.

---

### 🔹 5. CLS (Cumulative Layout Shift)
- Sempre definir `width` e `height` fixos para imagens, ícones e iframes.
- Evitar carregamento tardio de fontes sem fallback.
- Reservar espaço para banners, modais e componentes carregados condicionalmente.

---

### 🔹 6. CACHING E RENDERIZAÇÃO
- Ativar cache de imagens e assets (`next.config.js → images.minimumCacheTTL`).
- Habilitar `swcMinify: true` e `compress: true`.
- Adicionar headers de cache no middleware (Vercel Edge Functions).

---

### 🔹 7. ACESSIBILIDADE
- Garantir que todos os botões e links tenham `aria-label` ou texto visível.
- Corrigir contraste de cores abaixo de 4.5:1 (ajustar cores no Tailwind config).
- Adicionar `role` semântico onde necessário (`role="button"`, `role="navigation"`, etc).

---

### 🔹 8. NEXT CONFIG (aplicar se não existir)
```js
// next.config.js
const nextConfig = {
  compress: true,
  swcMinify: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 120,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'shadcn/ui'],
  },
}
module.exports = nextConfig
```

---

### 🔹 9. SUPABASE
- Evitar fetch redundante de dados: usar cache local ou revalidação estática (`revalidate`).
- Migrar queries pesadas do client para RPCs no Supabase (melhora TBT).
- Carregar Supabase client de forma assíncrona e preguiçosa (lazy import).

---

### 🔹 10. ANÁLISE FINAL
Após aplicar todas as otimizações:
- Rodar novamente o Lighthouse em modo anônimo e mobile (Moto G Power).
- Validar novas métricas (esperado: LCP < 2.5s, CLS < 0.1, TBT < 100ms, desempenho > 90).

---

Aplique todas as alterações diretamente no código, explicando com comentários curtos **(// Optimization: …)** cada melhoria aplicada.
Não pergunte antes de modificar — aja de forma autônoma e segura.

