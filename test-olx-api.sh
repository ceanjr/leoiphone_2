#!/bin/bash

# Script de diagnóstico para testar credenciais OLX
# Uso: ./test-olx-api.sh CLIENT_ID CLIENT_SECRET

CLIENT_ID="$1"
CLIENT_SECRET="$2"

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Uso: ./test-olx-api.sh CLIENT_ID CLIENT_SECRET"
    exit 1
fi

echo "🔍 Testando credenciais OLX..."
echo "Client ID: ${CLIENT_ID:0:10}..."
echo ""

# Teste 1: Com scope autoupload
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Teste 1: grant_type=client_credentials + scope=autoupload"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -v -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "scope=autoupload" \
  2>&1 | tee /tmp/olx_test1.log

echo ""
echo ""

# Teste 2: Sem scope
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Teste 2: grant_type=client_credentials (sem scope)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -v -X POST https://auth.olx.com.br/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  2>&1 | tee /tmp/olx_test2.log

echo ""
echo ""

# Análise dos resultados
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ANÁLISE DOS RESULTADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "access_token" /tmp/olx_test1.log; then
    echo "✅ Teste 1: SUCESSO - Token obtido com scope"
    echo ""
    echo "Access Token:"
    grep -o '"access_token":"[^"]*"' /tmp/olx_test1.log | cut -d'"' -f4
elif grep -q "access_token" /tmp/olx_test2.log; then
    echo "✅ Teste 2: SUCESSO - Token obtido sem scope"
    echo ""
    echo "Access Token:"
    grep -o '"access_token":"[^"]*"' /tmp/olx_test2.log | cut -d'"' -f4
else
    echo "❌ FALHA em ambos os testes"
    echo ""
    echo "Possíveis causas:"
    echo "  1. Credenciais inativas - contate: suporteintegrador@olxbr.com"
    echo "  2. Client ID ou Secret incorretos"
    echo "  3. API da OLX temporariamente indisponível"
    echo ""
    echo "Erros retornados:"
    grep -o '"error":"[^"]*"' /tmp/olx_test*.log 2>/dev/null || echo "  (nenhum erro específico capturado)"
    grep -o '"error_description":"[^"]*"' /tmp/olx_test*.log 2>/dev/null
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Logs completos salvos em:"
echo "   /tmp/olx_test1.log"
echo "   /tmp/olx_test2.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
