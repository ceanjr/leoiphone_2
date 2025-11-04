# Diagnóstico do Erro "Invalid Request" - OLX

## 🔴 Erro Recebido

```
invalid request
```

Este erro geralmente significa que a API da OLX não aceitou suas credenciais.

## 🔍 Diagnóstico Rápido

### Passo 1: Teste suas credenciais via terminal

```bash
./test-olx-api.sh SEU_CLIENT_ID SEU_CLIENT_SECRET
```

Este script vai:
- Testar com scope `autoupload`
- Testar sem scope
- Mostrar exatamente qual erro a OLX está retornando
- Salvar logs em `/tmp/olx_test1.log` e `/tmp/olx_test2.log`

### Passo 2: Interpretação dos Erros

#### ❌ `invalid_client`
**Causa:** Client ID ou Client Secret incorretos ou inativos

**Solução:**
1. Verifique se copiou as credenciais corretamente
2. Não deve haver espaços no início/fim
3. São case-sensitive (maiúsculas/minúsculas importam)
4. Se corretas, suas credenciais podem estar inativas

**Ação:** Entre em contato com `suporteintegrador@olxbr.com`

#### ❌ `invalid_request`
**Causa:** Parâmetros da requisição incorretos ou API não aceita o formato

**Possíveis razões:**
1. Scope `autoupload` não está habilitado para sua conta
2. Grant type `client_credentials` não está habilitado
3. API da OLX mudou e não aceita mais este formato

**Solução:**
```bash
# Tente sem o scope
curl -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET"
```

#### ❌ `unauthorized_client`
**Causa:** Seu Client ID não tem permissão para usar este grant type

**Solução:** Entre em contato com o suporte OLX para habilitar `client_credentials`

#### ❌ `invalid_scope`
**Causa:** O scope `autoupload` não está disponível

**Solução:** Remova o scope da requisição ou solicite habilitação ao suporte

## 🛠️ Testes Manuais

### Teste 1: Via cURL (Completo)
```bash
curl -v -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  -d "grant_type=client_credentials" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "scope=autoupload"
```

### Teste 2: Via cURL (Sem Scope)
```bash
curl -v -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET"
```

### Teste 3: Via Node.js
```bash
node test-olx-credentials.js SEU_CLIENT_ID SEU_CLIENT_SECRET
```

## 📋 Checklist de Verificação

- [ ] Client ID está correto (sem espaços extras)
- [ ] Client Secret está correto (sem espaços extras)
- [ ] Credenciais foram copiadas do email/portal OLX recente
- [ ] Testei via cURL no terminal
- [ ] Verifiquei os logs em `/tmp/olx_test*.log`
- [ ] Tentei com e sem o scope `autoupload`
- [ ] Consultei a documentação da OLX se disponível

## 🆘 Se Nada Funcionar

### Entre em contato com OLX

**Email:** suporteintegrador@olxbr.com

**Assunto:** "Erro invalid_request ao gerar token - Client ID: [SEU_ID]"

**Corpo do email:**
```
Olá,

Estou recebendo erro "invalid_request" ao tentar gerar access token 
para integração de anúncios.

Informações:
- Client ID: [SEU_CLIENT_ID]
- Grant Type: client_credentials
- Scope: autoupload
- Erro recebido: [COPIAR ERRO DO LOG]

Testes realizados:
- Via cURL: [resultado]
- Via API: [resultado]

Solicito:
1. Verificação se minhas credenciais estão ativas
2. Confirmação se o scope 'autoupload' está habilitado
3. Novo access token se necessário

Logs completos em anexo.

Obrigado!
```

**Anexar:**
- `/tmp/olx_test1.log`
- `/tmp/olx_test2.log`

## 💡 Alternativas Enquanto Aguarda

### 1. Token Manual do Suporte
Se o suporte fornecer um token diretamente, use o método "Token Manual" na interface.

### 2. Portal OLX (se disponível)
Alguns integradores têm acesso a um portal onde podem gerar tokens manualmente.

### 3. Método OAuth Flow
Se suas credenciais suportam, tente o método "OAuth Flow (Browser)" na interface.

## 📊 Análise de Logs

Para analisar os logs salvos:

```bash
# Ver resposta completa do teste 1
cat /tmp/olx_test1.log

# Ver apenas o erro
grep -i error /tmp/olx_test1.log

# Ver status HTTP
grep "HTTP/" /tmp/olx_test1.log
```

## 🔄 Próximos Passos

1. ✅ Execute `./test-olx-api.sh` com suas credenciais
2. 📝 Analise o erro específico retornado
3. 🔍 Consulte a seção de interpretação acima
4. 📧 Se necessário, entre em contato com o suporte
5. ⏳ Aguarde resposta (geralmente 1-3 dias úteis)
6. 🎉 Insira o token na interface quando receber

---

**Última atualização:** 2025-01-04
**Versão:** 2.0
