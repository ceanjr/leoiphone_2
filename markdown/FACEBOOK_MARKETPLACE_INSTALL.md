# 📦 Instalação: Facebook Marketplace Integration

## 1. Instalar Dependências

Execute o seguinte comando para instalar os pacotes necessários do Radix UI:

```bash
npm install @radix-ui/react-scroll-area @radix-ui/react-tabs
```

## 2. Executar Migration no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie todo o conteúdo de `supabase-migration-facebook-marketplace.sql`
4. Cole e execute

## 3. Adicionar Rota no Sidebar

Edite `components/admin/sidebar.tsx`:

```typescript
import { Store } from 'lucide-react' // ou Facebook

// Adicione na lista de rotas:
const routes = [
  // ... outras rotas
  {
    label: 'Anúncios Facebook',
    icon: Store,
    href: '/admin/anuncios',
  },
]
```

## 4. Configurar Variáveis de Ambiente (Opcional)

Se quiser, adicione ao `.env.local`:

```env
# URL pública do site (usado nos anúncios)
NEXT_PUBLIC_SITE_URL=https://leoiphone.com.br
```

## 5. Testar Localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000/admin/anuncios`

## 6. Deploy

Após testar localmente:

```bash
git add .
git commit -m "feat: integração com Facebook Marketplace"
git push
```

Vercel fará deploy automático.

## 7. Configurar Facebook

Siga o guia completo em `FACEBOOK_MARKETPLACE_SETUP.md` para:

1. Criar App no Facebook Developers
2. Configurar Business Manager
3. Criar Catálogo de Produtos
4. Gerar Access Token
5. Configurar no Admin

---

## ✅ Checklist

- [ ] Dependências instaladas (`npm install`)
- [ ] Migration executada no Supabase
- [ ] Rota adicionada no sidebar
- [ ] Testado localmente
- [ ] Deploy realizado
- [ ] Facebook configurado
- [ ] Primeiro anúncio criado

---

## 🎯 Resultado Final

Após completar todos os passos, você terá:

✅ Nova página **Admin → Anúncios Facebook**
✅ Sistema funcional de criar/remover anúncios
✅ Integração completa com Facebook Graph API
✅ Logs detalhados de sincronização
✅ UI responsiva e intuitiva

---

## 📚 Documentação

- **Setup Completo:** `FACEBOOK_MARKETPLACE_SETUP.md`
- **Quick Start:** `docs/FACEBOOK_MARKETPLACE_QUICK_START.md`
- **Este arquivo:** Instruções de instalação técnica

---

**Próximo passo:** Leia `FACEBOOK_MARKETPLACE_SETUP.md` para configurar o Facebook.
