
# ✅ CHECKLIST DE DEPLOYMENT - CloudBPO

## PRÉ-DEPLOYMENT
- [ ] Backup do index.html atual do servidor
- [ ] Verificar acesso ao servidor (FTP/SSH)
- [ ] Confirmar diretório web root (/var/www/html ou similar)

## DEPLOYMENT RÁPIDO (RECOMENDADO)
- [ ] Baixar /workspace/deployment-package/index.html
- [ ] Fazer upload para substituir index.html no servidor
- [ ] Testar URL: https://cloudbpov1.mgx.world/mobile/counting/74945ff0-41e7-4c06-a7b6-1402bb65741c

## DEPLOYMENT COMPLETO (OPCIONAL)
- [ ] Fazer upload de todos os arquivos do pacote
- [ ] Executar: sudo ./deploy.sh
- [ ] Verificar logs do servidor
- [ ] Testar múltiplas URLs

## PÓS-DEPLOYMENT
- [ ] Testar em celular novo (modo incógnito)
- [ ] Verificar console do navegador (deve mostrar logs EMERGENCY FIX)
- [ ] Confirmar redirecionamento para hash route
- [ ] Testar em diferentes navegadores

## TROUBLESHOOTING
- [ ] Se ainda 404: verificar se arquivo foi substituído
- [ ] Se não redireciona: verificar console JavaScript
- [ ] Se erro de permissão: ajustar chmod 644 index.html
