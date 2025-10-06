# CloudBPO - Guia Completo de Deploy e Desenvolvimento

## Visão Geral do Sistema

O CloudBPO é um sistema completo de gestão financeira e estoque desenvolvido em React/TypeScript com backend Supabase. Este guia fornece todas as informações técnicas necessárias para deploy em domínio próprio e configuração de ambiente de desenvolvimento.

## Arquitetura do Sistema

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Autenticação**: Context API personalizado
- **Estado**: React Context + Local Storage
- **Roteamento**: React Router DOM
- **Build**: Vite (desenvolvimento e produção)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Autenticação**: Sistema customizado via Supabase
- **Storage**: Supabase Storage para arquivos
- **API**: Supabase REST API + Real-time subscriptions

### Infraestrutura Recomendada
- **Servidor Web**: Nginx ou Apache
- **SSL**: Let's Encrypt (gratuito)
- **CDN**: Cloudflare (opcional, mas recomendado)
- **Monitoramento**: PM2 para Node.js processes

## Requisitos Técnicos

### Servidor de Produção
```bash
# Especificações mínimas
- CPU: 2 vCPUs
- RAM: 4GB
- Storage: 50GB SSD
- Bandwidth: 100GB/mês
- OS: Ubuntu 20.04+ ou CentOS 8+

# Software necessário
- Node.js 18+
- npm ou yarn
- Nginx
- Certbot (SSL)
- Git
```

### Servidor de Desenvolvimento
```bash
# Especificações mínimas
- CPU: 1 vCPU
- RAM: 2GB
- Storage: 20GB
- OS: Ubuntu 20.04+

# Software necessário
- Node.js 18+
- npm ou yarn
- Git
```

## Configuração do Supabase

### 1. Criar Projeto Supabase
```bash
# Acesse https://supabase.com
# Crie uma nova organização/projeto
# Anote as credenciais:
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
```

### 2. Configurar Tabelas
```sql
-- Execute no SQL Editor do Supabase

-- Tabela de empresas
CREATE TABLE app_0bcfd220f3_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    type VARCHAR(50) DEFAULT 'cliente',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE app_0bcfd220f3_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    accessible_companies UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de setores
CREATE TABLE app_0bcfd220f3_sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias de produtos
CREATE TABLE app_0bcfd220f3_product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE app_0bcfd220f3_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    category_id UUID REFERENCES app_0bcfd220f3_product_categories(id),
    sector_id UUID REFERENCES app_0bcfd220f3_sectors(id),
    unit VARCHAR(50),
    conversion_factor INTEGER DEFAULT 1,
    alternative_unit VARCHAR(50),
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contagens
CREATE TABLE app_0bcfd220f3_countings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    internal_id VARCHAR(10),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    scheduled_date DATE,
    scheduled_time TIME,
    employee_name VARCHAR(255),
    mobile_link VARCHAR(255),
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    created_by UUID REFERENCES app_0bcfd220f3_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de itens de contagem
CREATE TABLE app_0bcfd220f3_counting_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    counting_id UUID REFERENCES app_0bcfd220f3_countings(id),
    product_id UUID REFERENCES app_0bcfd220f3_products(id),
    counted_quantity INTEGER DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    notes TEXT,
    counted_by VARCHAR(255),
    counted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas auxiliares para contagens
CREATE TABLE app_0bcfd220f3_counting_sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    counting_id UUID REFERENCES app_0bcfd220f3_countings(id),
    sector_id UUID REFERENCES app_0bcfd220f3_sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE app_0bcfd220f3_counting_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    counting_id UUID REFERENCES app_0bcfd220f3_countings(id),
    product_id UUID REFERENCES app_0bcfd220f3_products(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE app_0bcfd220f3_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'normal',
    sender_id UUID REFERENCES app_0bcfd220f3_users(id),
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE app_0bcfd220f3_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    user_id UUID REFERENCES app_0bcfd220f3_users(id),
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    reference_id UUID,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas do sistema financeiro (para super admin)
CREATE TABLE app_0bcfd220f3_subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    features TEXT[],
    max_users INTEGER DEFAULT -1,
    max_products INTEGER DEFAULT -1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE app_0bcfd220f3_company_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES app_0bcfd220f3_companies(id),
    plan_id UUID REFERENCES app_0bcfd220f3_subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE app_0bcfd220f3_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_subscription_id UUID REFERENCES app_0bcfd220f3_company_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Configurar RLS (Row Level Security)
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE app_0bcfd220f3_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_countings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_counting_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_counting_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_counting_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário)
CREATE POLICY "Enable read access for all users" ON app_0bcfd220f3_companies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON app_0bcfd220f3_users FOR SELECT USING (true);
-- Adicionar mais políticas conforme necessário
```

## Processo de Deploy

### 1. Preparar o Código
```bash
# Clone o repositório
git clone <repository-url> cloudbpo
cd cloudbpo

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### 2. Configurar Variáveis de Ambiente
```bash
# .env.production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_APP_ENV=production
VITE_APP_DOMAIN=www.cloudbpo.com
```

### 3. Build para Produção
```bash
# Build do projeto
npm run build

# Testar build localmente
npm run preview
```

### 4. Configurar Servidor Web (Nginx)
```nginx
# /etc/nginx/sites-available/cloudbpo.com
server {
    listen 80;
    server_name www.cloudbpo.com cloudbpo.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.cloudbpo.com cloudbpo.com;

    ssl_certificate /etc/letsencrypt/live/www.cloudbpo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.cloudbpo.com/privkey.pem;

    root /var/www/cloudbpo/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (se necessário)
    location /api/ {
        proxy_pass https://seu-projeto.supabase.co/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. Script de Deploy Automatizado
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Iniciando deploy do CloudBPO..."

# Variáveis
REPO_URL="https://github.com/seu-usuario/cloudbpo.git"
DEPLOY_DIR="/var/www/cloudbpo"
BACKUP_DIR="/var/backups/cloudbpo"

# Backup da versão atual
if [ -d "$DEPLOY_DIR" ]; then
    echo "📦 Fazendo backup da versão atual..."
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
fi

# Clone/Pull do código
if [ -d "$DEPLOY_DIR" ]; then
    echo "🔄 Atualizando código..."
    cd "$DEPLOY_DIR"
    sudo git pull origin main
else
    echo "📥 Clonando repositório..."
    sudo git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# Instalar dependências
echo "📦 Instalando dependências..."
sudo npm ci --production=false

# Build
echo "🏗️ Fazendo build..."
sudo npm run build

# Ajustar permissões
echo "🔐 Ajustando permissões..."
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# Reload Nginx
echo "🔄 Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Site disponível em: https://www.cloudbpo.com"
```

## Configuração de Desenvolvimento

### 1. Ambiente de Desenvolvimento
```bash
# Servidor de desenvolvimento
# Especificações: 1 vCPU, 2GB RAM, Ubuntu 20.04

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone do projeto
git clone <repository-url> cloudbpo-dev
cd cloudbpo-dev

# Instalar dependências
npm install

# Configurar ambiente de desenvolvimento
cp .env.example .env.development
```

### 2. Variáveis de Ambiente - Desenvolvimento
```bash
# .env.development
VITE_SUPABASE_URL=https://projeto-dev.supabase.co
VITE_SUPABASE_ANON_KEY=chave-desenvolvimento
VITE_APP_ENV=development
VITE_APP_DOMAIN=dev.cloudbpo.com
```

### 3. Workflow de Desenvolvimento
```bash
# Estrutura de branches
main          # Produção
develop       # Desenvolvimento
feature/*     # Features
hotfix/*      # Correções urgentes

# Comandos de desenvolvimento
npm run dev           # Servidor de desenvolvimento
npm run build         # Build de produção
npm run preview       # Preview do build
npm run lint          # Verificar código
npm run type-check    # Verificar TypeScript
```

## Configuração de SSL

### 1. Instalar Certbot
```bash
sudo apt update
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 2. Obter Certificado SSL
```bash
# Parar Nginx temporariamente
sudo systemctl stop nginx

# Obter certificado
sudo certbot certonly --standalone -d www.cloudbpo.com -d cloudbpo.com

# Reiniciar Nginx
sudo systemctl start nginx

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoramento e Manutenção

### 1. Logs do Sistema
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

### 2. Backup Automatizado
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/cloudbpo"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup do código
tar -czf "$BACKUP_DIR/code-$DATE.tar.gz" /var/www/cloudbpo

# Backup do banco (via Supabase CLI se necessário)
# supabase db dump --file "$BACKUP_DIR/database-$DATE.sql"

# Manter apenas os últimos 7 backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

### 3. Script de Monitoramento
```bash
#!/bin/bash
# monitor.sh

# Verificar se o site está respondendo
if ! curl -f -s https://www.cloudbpo.com > /dev/null; then
    echo "⚠️ Site não está respondendo!" | mail -s "CloudBPO Down" admin@cloudbpo.com
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️ Espaço em disco baixo: ${DISK_USAGE}%" | mail -s "Disk Space Warning" admin@cloudbpo.com
fi
```

## Processo de Atualizações

### 1. Fluxo de Desenvolvimento
```bash
# 1. Desenvolver feature
git checkout -b feature/nova-funcionalidade
# ... desenvolver ...
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade

# 2. Merge para develop
git checkout develop
git merge feature/nova-funcionalidade

# 3. Testar em ambiente de desenvolvimento
npm run build
npm run preview

# 4. Deploy para produção
git checkout main
git merge develop
git tag v1.0.1
git push origin main --tags

# 5. Deploy automático via webhook ou manual
./deploy.sh
```

### 2. Rollback em Caso de Problemas
```bash
#!/bin/bash
# rollback.sh

BACKUP_DIR="/var/backups/cloudbpo"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup-* | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    echo "🔄 Fazendo rollback para: $LATEST_BACKUP"
    sudo rm -rf /var/www/cloudbpo
    sudo cp -r "$LATEST_BACKUP" /var/www/cloudbpo
    sudo chown -R www-data:www-data /var/www/cloudbpo
    sudo systemctl reload nginx
    echo "✅ Rollback concluído!"
else
    echo "❌ Nenhum backup encontrado!"
fi
```

## Custos Estimados

### Infraestrutura Mensal
```
Servidor Produção (4GB RAM, 2 vCPU):     $20-40/mês
Servidor Desenvolvimento (2GB RAM):      $10-20/mês
Domínio (.com):                          $10-15/ano
SSL (Let's Encrypt):                     Gratuito
Supabase (Pro Plan):                     $25/mês
CDN Cloudflare (opcional):               $0-20/mês

Total estimado: $55-100/mês
```

### Provedores Recomendados
- **DigitalOcean**: Droplets com boa performance
- **Linode**: Excelente custo-benefício
- **Vultr**: Rede global, boa para Brasil
- **AWS Lightsail**: Integração com outros serviços AWS

## Suporte e Manutenção

### 1. Documentação Técnica
- Manter README.md atualizado
- Documentar APIs e componentes
- Criar guias de troubleshooting

### 2. Contatos de Suporte
```
Desenvolvedor Principal: [seu-email]
Suporte Técnico: suporte@cloudbpo.com
Emergências: [telefone-emergencia]
```

### 3. SLA Recomendado
- **Uptime**: 99.5% (máximo 3.6 horas de downtime/mês)
- **Tempo de resposta**: < 2 segundos
- **Backup**: Diário com retenção de 30 dias
- **Atualizações**: Mensais ou conforme necessário

## Próximos Passos

1. **Configurar Supabase** - Criar projeto e configurar tabelas
2. **Preparar Servidor** - Contratar VPS e configurar ambiente
3. **Configurar Domínio** - Apontar DNS para o servidor
4. **Deploy Inicial** - Fazer primeiro deploy e testes
5. **Configurar Monitoramento** - Implementar scripts de backup e monitoramento
6. **Treinamento** - Treinar equipe no uso do sistema

## Contato para Ajustes

Para solicitar ajustes e melhorias no sistema:

1. **Issues no GitHub**: Criar issues detalhadas
2. **Email**: Enviar especificações por email
3. **Reuniões**: Agendar calls para discussões técnicas
4. **Documentação**: Manter changelog atualizado

---

Este guia fornece uma base sólida para deploy e manutenção do CloudBPO. Ajuste conforme suas necessidades específicas e ambiente de infraestrutura.