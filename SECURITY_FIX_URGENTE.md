# 🚨 CORREÇÃO URGENTE DE SEGURANÇA

## ⚠️ PROBLEMA DETECTADO

GitGuardian detectou que sua **Supabase Service Role Key** foi exposta no GitHub.

## 📋 AÇÕES IMEDIATAS (FAZER AGORA!)

### 1. Rotacionar a chave no Supabase (URGENTE!)

1. Acesse: https://supabase.com/dashboard
2. Vá em seu projeto → **Settings** → **API**
3. Role até "Service Role Key"
4. Clique em **"Generate new key"** ou **"Rotate"**
5. **COPIE A NOVA CHAVE** e guarde em local seguro
6. A chave antiga será invalidada

### 2. Atualizar .env.local com a nova chave

```bash
# Abra .env.local e substitua:
SUPABASE_SERVICE_ROLE_KEY=<NOVA_CHAVE_AQUI>
```

### 3. Limpar histórico do Git (IMPORTANTE!)

```bash
# Instalar BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# Ou usar git-filter-repo
pip install git-filter-repo

# Remover chaves do histórico
git filter-repo --path scripts/ --invert-paths --force

# Ou usar BFG:
bfg --replace-text passwords.txt

# Criar arquivo passwords.txt com:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2VqcWJ0ZWppYnJpbHJibG5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjQ2MywiZXhwIjoyMDc2ODg4NDYzfQ.98uyNcAHMtDPgXeEt73Qo5dmUzetQQKgt3m9_T_r4oo
```

### 4. Force push (após backup!)

```bash
# ATENÇÃO: Isso reescreve o histórico!
# Avise colaboradores antes!

git push origin --force --all
git push origin --force --tags
```

### 5. Verificar outros repositórios

- Verifique se fez fork ou cópias deste repo
- Rotacione chaves em todos os lugares

## 📝 ARQUIVOS COM CHAVES EXPOSTAS

- `scripts/fix-image-orientation.ts`
- `scripts/fix-supabase-urls-final.ts`
- `scripts/fix-supabase-image-urls.ts`
- `scripts/fix-duplicate-image-paths.ts`

## ✅ CORREÇÃO APLICADA

Os scripts foram corrigidos para usar variáveis de ambiente.

## 🔒 PREVENÇÃO FUTURA

1. **NUNCA** commitar arquivos com chaves
2. Sempre usar variáveis de ambiente
3. Verificar antes de commit: `git diff --cached`
4. Usar .gitignore corretamente
5. Ativar GitHub secret scanning
6. Usar pre-commit hooks

## 🛡️ VERIFICAÇÃO DE SEGURANÇA

Execute:
```bash
# Verificar se há chaves no repo
git log -S "service_role" --all
git log -S "eyJhbGciOiJIUzI1" --all

# Verificar arquivos atuais
grep -r "service_role" . --exclude-dir=node_modules --exclude-dir=.git
```

## 📞 SUPORTE

Se precisar de ajuda:
- Supabase Support: https://supabase.com/support
- GitHub Support: https://support.github.com

---

**IMPORTANTE:** Execute IMEDIATAMENTE a rotação de chaves antes de continuar!
