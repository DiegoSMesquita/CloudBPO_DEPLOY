#!/bin/bash
# CloudBPO Emergency Deployment Script

echo "🚨 INICIANDO DEPLOYMENT DE EMERGÊNCIA - CloudBPO"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Erro: index.html não encontrado. Execute este script no diretório de deployment."
    exit 1
fi

# Backup existing files
echo "💾 Fazendo backup dos arquivos existentes..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Copy existing files to backup (if they exist)
[ -f "/var/www/html/index.html" ] && cp /var/www/html/index.html $BACKUP_DIR/
[ -f "/var/www/html/.htaccess" ] && cp /var/www/html/.htaccess $BACKUP_DIR/

echo "📁 Copiando arquivos para o servidor..."
# Copy new files
cp index.html /var/www/html/
cp .htaccess /var/www/html/
cp _redirects /var/www/html/

# Set proper permissions
chmod 644 /var/www/html/index.html
chmod 644 /var/www/html/.htaccess
chmod 644 /var/www/html/_redirects

echo "🔄 Reiniciando serviços..."
# Restart web server (try different options)
if command -v systemctl &> /dev/null; then
    systemctl reload nginx 2>/dev/null || systemctl reload apache2 2>/dev/null || echo "⚠️  Reinicie manualmente o servidor web"
else
    service nginx reload 2>/dev/null || service apache2 reload 2>/dev/null || echo "⚠️  Reinicie manualmente o servidor web"
fi

echo "✅ DEPLOYMENT CONCLUÍDO!"
echo "🧪 Teste a URL: https://cloudbpov1.mgx.world/mobile/counting/74945ff0-41e7-4c06-a7b6-1402bb65741c"
