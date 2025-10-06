# 🚨 INSTRUÇÕES DE DEPLOYMENT URGENTE

## PROBLEMA ATUAL
- URLs diretas retornam 404 em celulares novos
- Servidor nginx não configurado para SPA

## SOLUÇÃO IMPLEMENTADA
1. **index.html** - Redirecionamento JavaScript IMEDIATO
2. **index.php** - Redirecionamento server-side (se PHP disponível)

## COMO DEPLOYAR

### OPÇÃO 1: Upload Manual (MAIS RÁPIDO)
1. Faça upload dos arquivos atualizados:
   - /workspace/shadcn-ui/dist/index.html
   - /workspace/shadcn-ui/dist/index.php

### OPÇÃO 2: Configurar Servidor (DEFINITIVO)
1. Configure nginx para servir index.html em caso de 404
2. Ou configure Apache com .htaccess

## TESTE
Após deployment, teste a URL:
https://cloudbpov1.mgx.world/mobile/counting/74945ff0-41e7-4c06-a7b6-1402bb65741c

## RESULTADO ESPERADO
- Celular novo: Redirecionamento automático para /#/mobile/counting/...
- URL funciona em qualquer dispositivo
