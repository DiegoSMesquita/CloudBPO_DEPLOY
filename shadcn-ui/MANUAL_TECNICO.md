# Manual Técnico - CloudBPO

## Visão Geral
CloudBPO é uma plataforma avançada de gerenciamento de inventário desenvolvida especificamente para a indústria de foodservice. A plataforma oferece autenticação segura, rastreamento de inventário em tempo real, ferramentas de relatórios detalhadas e integração com WhatsApp.

## Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool moderno e rápido
- **Tailwind CSS** - Framework CSS utility-first
- **Shadcn/ui** - Componentes UI reutilizáveis
- **Lucide React** - Ícones modernos
- **date-fns** - Biblioteca para manipulação de datas

### Backend
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança a nível de linha

## Estrutura do Projeto

```
shadcn-ui/
├── README.md                    # Documentação do projeto
├── package.json                 # Dependências e scripts
├── index.html                   # Ponto de entrada HTML
├── vite.config.ts              # Configuração do Vite
├── tailwind.config.ts          # Configuração do Tailwind
├── tsconfig.json               # Configuração do TypeScript
├── src/
│   ├── App.tsx                 # Componente principal da aplicação
│   ├── main.tsx                # Ponto de entrada React
│   ├── components/             # Componentes reutilizáveis
│   │   ├── Layout.tsx          # Layout principal
│   │   ├── Navbar.tsx          # Barra de navegação
│   │   ├── NotificationSystem.tsx # Sistema de notificações
│   │   └── ui/                 # Componentes UI base
│   ├── contexts/               # Contextos React
│   │   ├── AuthContext.tsx     # Contexto de autenticação
│   │   └── CompanyContext.tsx  # Contexto de empresa
│   ├── lib/                    # Bibliotecas e utilitários
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── database.ts         # Operações de banco local
│   │   ├── permissions.ts      # Sistema de permissões
│   │   └── types.ts            # Definições de tipos
│   └── pages/                  # Páginas da aplicação
│       ├── Login.tsx           # Página de login
│       ├── Dashboard.tsx       # Dashboard principal
│       ├── Products.tsx        # Gerenciamento de produtos
│       ├── Sectors.tsx         # Gerenciamento de setores
│       ├── Countings.tsx       # Gerenciamento de contagens
│       ├── CountingMobile.tsx  # Interface mobile para contagem
│       ├── Users.tsx           # Gerenciamento de usuários
│       ├── Companies.tsx       # Gerenciamento de empresas
│       ├── Financial.tsx       # Gestão financeira
│       ├── MyBPO.tsx          # Comunicações internas
│       └── NotFound.tsx        # Página 404
└── public/                     # Arquivos estáticos
    ├── favicon.svg
    └── robots.txt
```

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou pnpm
- Conta no Supabase

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd shadcn-ui
```

2. **Instale as dependências**
```bash
pnpm install
# ou
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Configure o banco de dados**
Execute os scripts SQL no Supabase para criar as tabelas necessárias (ver seção Estrutura do Banco).

5. **Execute o projeto**
```bash
pnpm run dev
# ou
npm run dev
```

## Estrutura do Banco de Dados

### Tabelas Principais

#### 1. companies
```sql
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
```

#### 2. users
```sql
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

#### 3. sectors
```sql
CREATE TABLE sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. product_categories
```sql
CREATE TABLE product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. products
```sql
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

#### 6. countings
```sql
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
```

#### 7. counting_items
```sql
CREATE TABLE counting_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counting_id UUID REFERENCES countings(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  counted_quantity DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counting_id, product_id)
);
```

#### 8. product_movements
```sql
CREATE TABLE product_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  type TEXT NOT NULL, -- 'ENTRADA' ou 'SAIDA'
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

### Políticas RLS (Row Level Security)

Todas as tabelas devem ter RLS habilitado com políticas apropriadas:

```sql
-- Exemplo para tabela products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products from their company" ON products
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert products to their company" ON products
  FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
```

## Funcionalidades Principais

### 1. Autenticação e Gestão de Usuários
- **Login seguro** com validação de credenciais
- **Gestão de perfis** de usuário com diferentes níveis de acesso
- **Multi-empresa** - usuários podem ter acesso a múltiplas empresas
- **Controle de permissões** baseado em roles

### 2. Gestão de Inventário
- **Cadastro de produtos** com categorias e setores
- **Controle de estoque** em tempo real
- **Unidades de medida** e fatores de conversão
- **Histórico de movimentações**

### 3. Sistema de Contagens
- **Criação de contagens** com setores específicos
- **Interface mobile** otimizada para contagem
- **Gestão de prazos** com notificações automáticas
- **Aprovação de contagens** com atualização de estoque
- **Integração WhatsApp** para notificações

### 4. Dashboard e Relatórios
- **Visão geral** de tarefas e mensagens
- **Relatórios detalhados** de movimentações
- **Exportação** para Excel/CSV
- **Notificações** de baixo estoque

### 5. Comunicação Interna
- **Sistema de mensagens** entre usuários
- **Anexos** em mensagens
- **Priorização** de mensagens importantes

## Componentes Principais

### AuthContext
Gerencia o estado de autenticação da aplicação:
- Login/logout de usuários
- Persistência de sessão
- Controle de acesso a rotas

### CompanyContext
Gerencia o contexto da empresa selecionada:
- Seleção de empresa ativa
- Filtros baseados em empresa
- Dados específicos da empresa

### Layout
Componente principal que envolve toda a aplicação:
- Navegação principal
- Sistema de notificações
- Controle de responsividade

### Páginas Principais

#### Products.tsx
- **CRUD completo** de produtos
- **Categorização** por setores
- **Controle de estoque** mínimo/máximo
- **Histórico de movimentações**

#### Countings.tsx
- **Criação de contagens** com múltiplos setores
- **Gestão de status** (pendente, em andamento, concluída, aprovada)
- **Interface de aprovação** com ajustes
- **Integração WhatsApp** para notificações

#### CountingMobile.tsx
- **Interface otimizada** para dispositivos móveis
- **Escaneamento de códigos** (futuro)
- **Entrada rápida** de quantidades
- **Sincronização em tempo real**

## Scripts Disponíveis

```json
{
  "dev": "vite",                    // Servidor de desenvolvimento
  "build": "tsc && vite build",     // Build para produção
  "lint": "eslint . --ext ts,tsx",  // Verificação de código
  "preview": "vite preview"         // Preview do build
}
```

## Configuração de Desenvolvimento

### ESLint
Configurado para TypeScript e React com regras rigorosas:
- Detecção de código não utilizado
- Verificação de tipos
- Padrões de código consistentes

### Tailwind CSS
Configuração personalizada com:
- Cores do tema da aplicação
- Componentes customizados
- Responsividade otimizada

### Vite
Configuração otimizada para:
- Hot Module Replacement (HMR)
- Build otimizado
- Suporte completo ao TypeScript

## Deployment

### Build de Produção
```bash
pnpm run build
```

### Variáveis de Ambiente de Produção
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica
```

### Hospedagem Recomendada
- **Vercel** - Deploy automático com GitHub
- **Netlify** - Deploy contínuo
- **Supabase Hosting** - Integração nativa

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com Supabase**
   - Verifique as variáveis de ambiente
   - Confirme se o projeto Supabase está ativo
   - Verifique as políticas RLS

2. **Problemas de autenticação**
   - Limpe o localStorage do navegador
   - Verifique se o usuário existe no banco
   - Confirme as permissões da empresa

3. **Erros de build**
   - Execute `pnpm install` para atualizar dependências
   - Verifique se não há erros de TypeScript
   - Confirme se todas as importações estão corretas

### Logs e Debug
- Use o console do navegador para erros frontend
- Monitore os logs do Supabase para erros de backend
- Ative o modo de desenvolvimento para logs detalhados

## Manutenção

### Atualizações Regulares
- Mantenha as dependências atualizadas
- Monitore vulnerabilidades de segurança
- Faça backup regular do banco de dados

### Monitoramento
- Acompanhe métricas de uso no Supabase
- Monitore performance da aplicação
- Verifique logs de erro regularmente

## Suporte

Para suporte técnico:
1. Verifique este manual primeiro
2. Consulte a documentação do Supabase
3. Verifique os logs de erro
4. Entre em contato com a equipe de desenvolvimento

---

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2024  
**Desenvolvido por:** Equipe CloudBPO