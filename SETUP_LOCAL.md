# Guia de Instalação Local - CloudBPO

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **pnpm** (recomendado) ou npm
- **Git** - [Download aqui](https://git-scm.com/)
- **Conta no Supabase** - [Criar conta](https://supabase.com/)

## 🚀 Instalação Passo a Passo

### 1. Preparação do Ambiente

#### Instalar pnpm (recomendado)
```bash
npm install -g pnpm
```

#### Verificar instalações
```bash
node --version    # Deve ser 18+
pnpm --version    # Deve estar instalado
git --version     # Deve estar instalado
```

### 2. Configuração do Projeto

#### Extrair o arquivo ZIP
1. Extraia o arquivo `cloudbpo-complete.zip`
2. Navegue até a pasta extraída:
```bash
cd shadcn-ui
```

#### Instalar dependências
```bash
pnpm install
```

### 3. Configuração do Supabase

#### Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com/)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha uma organização
5. Preencha os dados:
   - **Name**: CloudBPO
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a mais próxima
6. Clique em "Create new project"

#### Obter as chaves de API
1. No painel do Supabase, vá para **Settings > API**
2. Copie:
   - **Project URL**
   - **anon public key**

#### Configurar variáveis de ambiente
1. Na pasta do projeto, crie um arquivo `.env`:
```bash
touch .env
```

2. Adicione as seguintes variáveis:
```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 4. Configuração do Banco de Dados

#### Executar scripts SQL
1. No Supabase, vá para **SQL Editor**
2. Execute os seguintes scripts na ordem:

**Script 1: Criar tabelas básicas**
```sql
-- Criar tabela de empresas
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  subscription_status TEXT DEFAULT 'active',
  subscription_plan TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  company_id UUID REFERENCES companies(id),
  accessible_companies UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Script 2: Tabelas de produtos e setores**
```sql
-- Criar tabela de setores
CREATE TABLE sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de categorias
CREATE TABLE product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de produtos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category_id UUID REFERENCES product_categories(id),
  sector_id UUID REFERENCES sectors(id),
  unit TEXT DEFAULT 'unidade',
  conversion_factor DECIMAL DEFAULT 1,
  alternative_unit TEXT,
  min_stock DECIMAL DEFAULT 0,
  max_stock DECIMAL DEFAULT 0,
  current_stock DECIMAL DEFAULT 0,
  unit_cost DECIMAL DEFAULT 0,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Script 3: Sistema de contagens**
```sql
-- Criar tabela de contagens
CREATE TABLE countings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  internal_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  company_id UUID REFERENCES companies(id),
  created_by UUID REFERENCES users(id),
  employee_name TEXT,
  whatsapp_number TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  mobile_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de itens de contagem
CREATE TABLE counting_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counting_id UUID REFERENCES countings(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  counted_quantity DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counting_id, product_id)
);

-- Criar tabela de movimentações
CREATE TABLE product_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  type TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  counting_id UUID REFERENCES countings(id),
  balance_before DECIMAL DEFAULT 0,
  balance_after DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Script 4: Configurar RLS (Row Level Security)**
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE countings ENABLE ROW LEVEL SECURITY;
ALTER TABLE counting_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_movements ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (exemplo para products)
CREATE POLICY "Users can view products from their company" ON products
  FOR SELECT USING (company_id IN (
    SELECT unnest(accessible_companies) FROM users WHERE id = auth.uid()
    UNION
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert products to their company" ON products
  FOR INSERT WITH CHECK (company_id IN (
    SELECT unnest(accessible_companies) FROM users WHERE id = auth.uid()
    UNION
    SELECT company_id FROM users WHERE id = auth.uid()
  ));
```

**Script 5: Dados iniciais**
```sql
-- Inserir empresa de demonstração
INSERT INTO companies (name, email, phone, address) VALUES 
('CloudBPO Demo', 'demo@cloudbpo.com', '(11) 99999-9999', 'São Paulo, SP');

-- Inserir usuário administrador (substitua os valores)
INSERT INTO users (name, email, password, role, company_id, accessible_companies) 
SELECT 
  'Administrador',
  'admin@cloudbpo.com',
  'admin123',
  'admin',
  id,
  ARRAY[id]
FROM companies WHERE name = 'CloudBPO Demo';
```

### 5. Executar o Projeto

#### Iniciar servidor de desenvolvimento
```bash
pnpm run dev
```

#### Acessar a aplicação
1. Abra o navegador
2. Acesse: `http://localhost:5173`
3. Faça login com:
   - **Email**: admin@cloudbpo.com
   - **Senha**: admin123

### 6. Verificação da Instalação

#### Teste básico
1. ✅ Login funciona
2. ✅ Dashboard carrega
3. ✅ Pode criar produtos
4. ✅ Pode criar setores
5. ✅ Pode criar contagens

#### Solução de problemas comuns

**Erro de conexão com Supabase:**
```bash
# Verifique as variáveis de ambiente
cat .env
```

**Erro "Cannot find module":**
```bash
# Reinstale as dependências
rm -rf node_modules
pnpm install
```

**Erro de TypeScript:**
```bash
# Verifique erros de lint
pnpm run lint
```

## 🎯 Próximos Passos

Após a instalação bem-sucedida:

1. **Personalize a empresa**
   - Altere dados da empresa demo
   - Crie usuários adicionais
   - Configure setores específicos

2. **Configure produtos**
   - Cadastre categorias
   - Adicione produtos do seu inventário
   - Configure estoques mínimos/máximos

3. **Teste contagens**
   - Crie uma contagem de teste
   - Use a interface mobile
   - Teste o fluxo de aprovação

4. **Personalize a aplicação**
   - Altere cores no Tailwind
   - Adicione logo da empresa
   - Configure notificações

## 📞 Suporte

Se encontrar problemas:

1. Consulte o `MANUAL_TECNICO.md`
2. Verifique os logs do console do navegador
3. Verifique os logs do Supabase
4. Entre em contato: suporte@cloudbpo.com

---

**Boa sorte com sua instalação! 🚀**