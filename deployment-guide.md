# Guia Técnico Completo - Deploy do Financial Management System

## 📋 Índice
1. [Análise da Arquitetura Atual](#análise-da-arquitetura-atual)
2. [Requisitos Técnicos do Servidor](#requisitos-técnicos-do-servidor)
3. [Configuração de Domínio](#configuração-de-domínio)
4. [Ambiente de Desenvolvimento vs Produção](#ambiente-de-desenvolvimento-vs-produção)
5. [Processo de Deploy](#processo-de-deploy)
6. [CI/CD e Atualizações](#cicd-e-atualizações)
7. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
8. [Checklist de Deploy](#checklist-de-deploy)

---

## 🏗️ Análise da Arquitetura Atual

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5.4.10
- **Styling**: Tailwind CSS 3.4.14
- **UI Components**: Radix UI + Shadcn/ui
- **Backend**: Supabase (BaaS)
- **Charts**: Recharts 2.12.7
- **Icons**: Lucide React 0.454.0
- **Routing**: React Router DOM 6.28.0

### Estrutura do Projeto
```
src/
├── assets/images/          # Logos e imagens
├── components/ui/          # Componentes UI reutilizáveis
├── contexts/              # Context API (AuthContext)
├── lib/                   # Configurações e utilitários
│   ├── supabase.ts       # Cliente Supabase
│   ├── supabaseDatabase.ts # Funções do banco
│   ├── types.ts          # Tipos TypeScript
│   └── database.ts       # Funções de banco local
├── pages/                # Páginas da aplicação
└── App.tsx              # Componente principal
```

### Dependências Críticas
- **Runtime**: Node.js (compatível com versões 18+)
- **Package Manager**: npm ou yarn
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth

---

## 🖥️ Requisitos Técnicos do Servidor

### Especificações Mínimas de Hardware
- **CPU**: 2 vCPUs (recomendado: 4 vCPUs)
- **RAM**: 4GB (recomendado: 8GB)
- **Armazenamento**: 20GB SSD NVMe (recomendado: 50GB)
- **Largura de Banda**: 1TB/mês
- **Uptime**: 99.9% garantido

### Sistema Operacional
- **Recomendado**: Ubuntu 22.04 LTS ou CentOS 8+
- **Alternativas**: Debian 11+, Amazon Linux 2

### Software Necessário
```bash
# Node.js (versão 18 ou superior)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 para gerenciamento de processos
sudo npm install -g pm2

# Nginx para proxy reverso
sudo apt update
sudo apt install nginx

# Certbot para SSL
sudo apt install certbot python3-certbot-nginx

# Git para deploy
sudo apt install git
```

---

## 🌐 Configuração de Domínio

### 1. Configuração DNS
Configure os seguintes registros DNS no seu provedor:

```
Tipo    Nome                Valor                   TTL
A       @                   [IP_DO_SERVIDOR]        300
A       www                 [IP_DO_SERVIDOR]        300
CNAME   dev                 cloudbpo.com            300
CNAME   staging             cloudbpo.com            300
```

### 2. Configuração SSL/HTTPS
```bash
# Instalar certificado SSL gratuito
sudo certbot --nginx -d cloudbpo.com -d www.cloudbpo.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Configuração Nginx
Crie o arquivo `/etc/nginx/sites-available/cloudbpo.com`:

```nginx
server {
    listen 80;
    server_name cloudbpo.com www.cloudbpo.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cloudbpo.com www.cloudbpo.com;

    ssl_certificate /etc/letsencrypt/live/cloudbpo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloudbpo.com/privkey.pem;

    root /var/www/cloudbpo/dist;
    index index.html;

    # Configuração para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

---

## 🔧 Ambiente de Desenvolvimento vs Produção

### Estrutura de Ambientes

#### 1. Desenvolvimento Local
```bash
# Clonar repositório
git clone [REPO_URL] financial-system-dev
cd financial-system-dev

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
```

#### 2. Ambiente de Staging
```bash
# Servidor de staging (subdomínio staging.cloudbpo.com)
git clone [REPO_URL] financial-system-staging
cd financial-system-staging
git checkout develop
```

#### 3. Ambiente de Produção
```bash
# Servidor de produção (www.cloudbpo.com)
git clone [REPO_URL] financial-system-prod
cd financial-system-prod
git checkout main
```

### Configuração de Variáveis de Ambiente

#### Arquivo `.env.local` (Desenvolvimento)
```env
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[DEVELOPMENT_ANON_KEY]
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

#### Arquivo `.env.staging` (Staging)
```env
VITE_SUPABASE_URL=https://[STAGING-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[STAGING_ANON_KEY]
VITE_APP_ENV=staging
VITE_APP_VERSION=1.0.0
```

#### Arquivo `.env.production` (Produção)
```env
VITE_SUPABASE_URL=https://[PRODUCTION-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[PRODUCTION_ANON_KEY]
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### Configuração Supabase para Produção

#### 1. Criar Projeto de Produção
```bash
# Instalar Supabase CLI
npm install -g @supabase/cli

# Login no Supabase
supabase login

# Criar novo projeto para produção
supabase projects create financial-system-prod --org [ORG-ID]
```

#### 2. Configurar Banco de Dados
```sql
-- Executar no SQL Editor do Supabase (Produção)

-- Criar tabelas principais
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  subscription_plan_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Users can view their own company data" ON companies
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM user_companies WHERE company_id = companies.id
  ));
```

#### 3. Configurar Autenticação
No painel do Supabase:
- **Authentication > Settings**
- **Site URL**: `https://www.cloudbpo.com`
- **Redirect URLs**: 
  - `https://www.cloudbpo.com/auth/callback`
  - `https://staging.cloudbpo.com/auth/callback` (para staging)

---

## 🚀 Processo de Deploy

### 1. Preparação do Servidor
```bash
# Conectar ao servidor
ssh root@[IP_DO_SERVIDOR]

# Criar usuário para deploy
adduser deploy
usermod -aG sudo deploy
su - deploy

# Criar diretórios
sudo mkdir -p /var/www/cloudbpo
sudo chown deploy:deploy /var/www/cloudbpo
```

### 2. Clone e Build do Projeto
```bash
# Clonar repositório
cd /var/www/cloudbpo
git clone [REPO_URL] .

# Instalar dependências
npm install

# Criar arquivo de ambiente de produção
cp .env.example .env.production
nano .env.production  # Configurar variáveis

# Build para produção
npm run build

# Verificar build
ls -la dist/
```

### 3. Configuração do PM2 (Para SSR/API se necessário)
```bash
# Criar arquivo de configuração PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'financial-system',
    script: 'serve',
    args: '-s dist -l 3000',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Instalar serve globalmente
sudo npm install -g serve

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Configuração Final do Nginx
```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/cloudbpo.com /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar status
sudo systemctl status nginx
```

---

## 🔄 CI/CD e Atualizações

### 1. Script de Deploy Automatizado
Crie o arquivo `/home/deploy/deploy.sh`:

```bash
#!/bin/bash

# Script de Deploy - Financial Management System
# Uso: ./deploy.sh [branch]

BRANCH=${1:-main}
PROJECT_DIR="/var/www/cloudbpo"
BACKUP_DIR="/var/backups/cloudbpo"

echo "🚀 Iniciando deploy da branch: $BRANCH"

# Criar backup
echo "📦 Criando backup..."
sudo mkdir -p $BACKUP_DIR
sudo tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $PROJECT_DIR dist

# Manter apenas os 5 backups mais recentes
sudo find $BACKUP_DIR -name "backup-*.tar.gz" -type f -mtime +5 -delete

# Atualizar código
echo "📥 Atualizando código..."
cd $PROJECT_DIR
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Instalar/atualizar dependências
echo "📚 Instalando dependências..."
npm ci --production=false

# Build
echo "🔨 Fazendo build..."
npm run build

# Verificar se build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro no build! Restaurando backup..."
    sudo tar -xzf "$BACKUP_DIR/backup-$(ls -t $BACKUP_DIR | head -1)" -C /
    exit 1
fi

# Reiniciar PM2 (se usando)
echo "🔄 Reiniciando aplicação..."
pm2 restart financial-system

# Recarregar Nginx
sudo nginx -s reload

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Site disponível em: https://www.cloudbpo.com"
```

### 2. GitHub Actions (Opcional)
Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/cloudbpo
          ./deploy.sh main
```

### 3. Processo de Rollback
```bash
#!/bin/bash
# Script de Rollback - rollback.sh

BACKUP_DIR="/var/backups/cloudbpo"
PROJECT_DIR="/var/www/cloudbpo"

echo "📋 Backups disponíveis:"
ls -lt $BACKUP_DIR/backup-*.tar.gz | head -5

read -p "Digite o nome do backup para restaurar: " BACKUP_FILE

if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "🔄 Restaurando backup: $BACKUP_FILE"
    sudo tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C /
    pm2 restart financial-system
    sudo nginx -s reload
    echo "✅ Rollback concluído!"
else
    echo "❌ Backup não encontrado!"
fi
```

---

## 📊 Monitoramento e Manutenção

### 1. Configuração de Logs
```bash
# Configurar rotação de logs
sudo nano /etc/logrotate.d/cloudbpo

# Conteúdo:
/var/log/nginx/cloudbpo.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

### 2. Script de Monitoramento
Crie `/home/deploy/monitor.sh`:

```bash
#!/bin/bash

# Monitor de Sistema - Financial Management System

LOG_FILE="/var/log/cloudbpo-monitor.log"

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Verificar se o site está respondendo
check_website() {
    if curl -f -s https://www.cloudbpo.com > /dev/null; then
        log "✅ Website OK"
    else
        log "❌ Website DOWN - Tentando reiniciar..."
        pm2 restart financial-system
        sudo nginx -s reload
    fi
}

# Verificar uso de disco
check_disk() {
    USAGE=$(df /var/www | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        log "⚠️ Disco com $USAGE% de uso"
    fi
}

# Verificar uso de memória
check_memory() {
    USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $USAGE -gt 85 ]; then
        log "⚠️ Memória com $USAGE% de uso"
    fi
}

# Executar verificações
check_website
check_disk
check_memory

log "📊 Monitoramento concluído"
```

### 3. Crontab para Monitoramento
```bash
# Editar crontab
crontab -e

# Adicionar:
# Monitoramento a cada 5 minutos
*/5 * * * * /home/deploy/monitor.sh

# Backup diário às 2h da manhã
0 2 * * * /home/deploy/backup.sh

# Limpeza de logs semanalmente
0 3 * * 0 find /var/log -name "*.log" -mtime +30 -delete
```

### 4. Backup Automático
Crie `/home/deploy/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/cloudbpo"
PROJECT_DIR="/var/www/cloudbpo"
DATE=$(date +%Y%m%d-%H%M%S)

# Criar backup completo
sudo mkdir -p $BACKUP_DIR
sudo tar -czf "$BACKUP_DIR/full-backup-$DATE.tar.gz" \
    -C /var/www cloudbpo \
    --exclude=node_modules \
    --exclude=.git

# Manter apenas backups dos últimos 30 dias
sudo find $BACKUP_DIR -name "full-backup-*.tar.gz" -mtime +30 -delete

echo "✅ Backup criado: full-backup-$DATE.tar.gz"
```

---

## ✅ Checklist de Deploy

### Pré-Deploy
- [ ] Servidor configurado com requisitos mínimos
- [ ] Domínio configurado e DNS propagado
- [ ] SSL/HTTPS configurado
- [ ] Projeto Supabase de produção criado
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do ambiente atual (se houver)

### Deploy
- [ ] Código clonado no servidor
- [ ] Dependências instaladas
- [ ] Build de produção executado
- [ ] Nginx configurado e testado
- [ ] PM2 configurado (se necessário)
- [ ] Site acessível via HTTPS

### Pós-Deploy
- [ ] Funcionalidades testadas
- [ ] Logs configurados
- [ ] Monitoramento ativo
- [ ] Backup automático configurado
- [ ] Scripts de deploy e rollback testados
- [ ] Documentação atualizada

### Testes de Produção
- [ ] Login/logout funcionando
- [ ] CRUD de empresas funcionando
- [ ] Dashboard carregando dados
- [ ] Relatórios sendo gerados
- [ ] Responsividade mobile
- [ ] Performance aceitável (< 3s carregamento)

---

## 🆘 Solução de Problemas Comuns

### Problema: Site não carrega
```bash
# Verificar status dos serviços
sudo systemctl status nginx
pm2 status

# Verificar logs
sudo tail -f /var/log/nginx/error.log
pm2 logs financial-system
```

### Problema: Erro de conexão com Supabase
```bash
# Verificar variáveis de ambiente
cat .env.production

# Testar conectividade
curl -I https://[PROJECT-ID].supabase.co
```

### Problema: Build falha
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📞 Suporte e Contatos

Para dúvidas técnicas ou problemas durante o deploy:

1. **Logs do Sistema**: `/var/log/cloudbpo-monitor.log`
2. **Logs do Nginx**: `/var/log/nginx/`
3. **Logs do PM2**: `pm2 logs`
4. **Status dos Serviços**: `pm2 status` e `sudo systemctl status nginx`

---

**Última atualização**: $(date)
**Versão do Guia**: 1.0
**Sistema**: Financial Management System - CloudBPO