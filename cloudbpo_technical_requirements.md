# CloudBPO - Especificações Técnicas Detalhadas

## Arquitetura do Sistema

### Stack Tecnológico
```
Frontend:
├── React 18.2.0
├── TypeScript 5.0+
├── Vite 4.0+ (Build Tool)
├── Tailwind CSS 3.3+
├── Shadcn/ui Components
├── React Router DOM 6.0+
├── Lucide React (Icons)
├── Date-fns (Date manipulation)
├── Sonner (Toast notifications)
└── React Hook Form (Forms)

Backend/Database:
├── Supabase (PostgreSQL)
├── Supabase Auth
├── Supabase Storage
├── Supabase Realtime
└── Row Level Security (RLS)

Build & Deploy:
├── Vite (Build)
├── ESLint + Prettier
├── TypeScript Compiler
├── PostCSS + Autoprefixer
└── Nginx (Web Server)
```

### Estrutura de Arquivos
```
cloudbpo/
├── public/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo-azul.png
│   │   │   ├── logo-branco.png
│   │   │   ├── icone-azul.png
│   │   │   └── icone-branco.png
│   │   └── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   └── common/          # Shared components
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── CompanyContext.tsx
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── database.ts      # Database abstraction
│   │   ├── supabase.ts      # Supabase client
│   │   ├── types.ts         # TypeScript types
│   │   ├── utils.ts         # Utility functions
│   │   └── permissions.ts   # User permissions
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Sectors.tsx
│   │   ├── Countings.tsx
│   │   ├── Companies.tsx
│   │   ├── Users.tsx
│   │   ├── Financial.tsx
│   │   ├── Login.tsx
│   │   └── CountingMobile.tsx
│   ├── assets/
│   │   └── images/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── README.md
```

## Configuração de Ambiente

### Dependências Principais
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "@supabase/supabase-js": "^2.39.3",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.263.1",
    "sonner": "^1.4.3",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
```

### Configuração do Vite
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
})
```

### Configuração do TypeScript
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitAny": false,
    "noFallthroughCasesInSwitch": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### Configuração do Tailwind CSS
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## Configuração do Banco de Dados

### Estrutura Completa das Tabelas
```sql
-- Configuração inicial
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de empresas
CREATE TABLE app_0bcfd220f3_companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    type VARCHAR(50) DEFAULT 'cliente' CHECK (type IN ('cliente', 'fornecedor', 'parceiro')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para empresas
CREATE INDEX idx_companies_cnpj ON app_0bcfd220f3_companies(cnpj);
CREATE INDEX idx_companies_status ON app_0bcfd220f3_companies(status);
CREATE INDEX idx_companies_type ON app_0bcfd220f3_companies(type);

-- Tabela de usuários
CREATE TABLE app_0bcfd220f3_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'viewer')),
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    accessible_companies UUID[] DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para usuários
CREATE INDEX idx_users_email ON app_0bcfd220f3_users(email);
CREATE INDEX idx_users_company_id ON app_0bcfd220f3_users(company_id);
CREATE INDEX idx_users_role ON app_0bcfd220f3_users(role);

-- Tabela de setores
CREATE TABLE app_0bcfd220f3_sectors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, company_id)
);

-- Índices para setores
CREATE INDEX idx_sectors_company_id ON app_0bcfd220f3_sectors(company_id);
CREATE INDEX idx_sectors_name ON app_0bcfd220f3_sectors(name);

-- Tabela de categorias de produtos
CREATE TABLE app_0bcfd220f3_product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, company_id)
);

-- Índices para categorias
CREATE INDEX idx_product_categories_company_id ON app_0bcfd220f3_product_categories(company_id);

-- Tabela de produtos
CREATE TABLE app_0bcfd220f3_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    category_id UUID REFERENCES app_0bcfd220f3_product_categories(id) ON DELETE SET NULL,
    sector_id UUID REFERENCES app_0bcfd220f3_sectors(id) ON DELETE SET NULL,
    unit VARCHAR(50) DEFAULT 'unidades',
    conversion_factor INTEGER DEFAULT 1 CHECK (conversion_factor > 0),
    alternative_unit VARCHAR(50),
    min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
    max_stock INTEGER DEFAULT 0 CHECK (max_stock >= 0),
    current_stock INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0.00 CHECK (unit_cost >= 0),
    sale_price DECIMAL(10,2) DEFAULT 0.00 CHECK (sale_price >= 0),
    barcode VARCHAR(50),
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para produtos
CREATE INDEX idx_products_company_id ON app_0bcfd220f3_products(company_id);
CREATE INDEX idx_products_category_id ON app_0bcfd220f3_products(category_id);
CREATE INDEX idx_products_sector_id ON app_0bcfd220f3_products(sector_id);
CREATE INDEX idx_products_code ON app_0bcfd220f3_products(code);
CREATE INDEX idx_products_barcode ON app_0bcfd220f3_products(barcode);
CREATE INDEX idx_products_name ON app_0bcfd220f3_products(name);

-- Tabela de contagens
CREATE TABLE app_0bcfd220f3_countings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    internal_id VARCHAR(10),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'approved', 'cancelled', 'expired')),
    scheduled_date DATE,
    scheduled_time TIME,
    employee_name VARCHAR(255),
    mobile_link VARCHAR(255),
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES app_0bcfd220f3_users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES app_0bcfd220f3_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Índices para contagens
CREATE INDEX idx_countings_company_id ON app_0bcfd220f3_countings(company_id);
CREATE INDEX idx_countings_status ON app_0bcfd220f3_countings(status);
CREATE INDEX idx_countings_created_by ON app_0bcfd220f3_countings(created_by);
CREATE INDEX idx_countings_mobile_link ON app_0bcfd220f3_countings(mobile_link);

-- Tabela de itens de contagem
CREATE TABLE app_0bcfd220f3_counting_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    counting_id UUID NOT NULL REFERENCES app_0bcfd220f3_countings(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES app_0bcfd220f3_products(id) ON DELETE CASCADE,
    expected_quantity INTEGER DEFAULT 0,
    counted_quantity INTEGER DEFAULT 0,
    quantity INTEGER DEFAULT 0, -- Alias para counted_quantity
    difference INTEGER GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
    notes TEXT,
    counted_by VARCHAR(255),
    counted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(counting_id, product_id)
);

-- Índices para itens de contagem
CREATE INDEX idx_counting_items_counting_id ON app_0bcfd220f3_counting_items(counting_id);
CREATE INDEX idx_counting_items_product_id ON app_0bcfd220f3_counting_items(product_id);

-- Tabelas auxiliares para contagens
CREATE TABLE app_0bcfd220f3_counting_sectors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    counting_id UUID NOT NULL REFERENCES app_0bcfd220f3_countings(id) ON DELETE CASCADE,
    sector_id UUID NOT NULL REFERENCES app_0bcfd220f3_sectors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(counting_id, sector_id)
);

CREATE TABLE app_0bcfd220f3_counting_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    counting_id UUID NOT NULL REFERENCES app_0bcfd220f3_countings(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES app_0bcfd220f3_products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(counting_id, product_id)
);

-- Tabela de movimentações de estoque
CREATE TABLE app_0bcfd220f3_stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES app_0bcfd220f3_products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'counting')),
    quantity INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(50), -- 'counting', 'manual', 'purchase', 'sale'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES app_0bcfd220f3_users(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para movimentações
CREATE INDEX idx_stock_movements_product_id ON app_0bcfd220f3_stock_movements(product_id);
CREATE INDEX idx_stock_movements_company_id ON app_0bcfd220f3_stock_movements(company_id);
CREATE INDEX idx_stock_movements_reference ON app_0bcfd220f3_stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_at ON app_0bcfd220f3_stock_movements(created_at);

-- Tabela de mensagens
CREATE TABLE app_0bcfd220f3_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    sender_id UUID REFERENCES app_0bcfd220f3_users(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mensagens
CREATE INDEX idx_messages_company_id ON app_0bcfd220f3_messages(company_id);
CREATE INDEX idx_messages_type ON app_0bcfd220f3_messages(type);
CREATE INDEX idx_messages_priority ON app_0bcfd220f3_messages(priority);

-- Tabela de notificações
CREATE TABLE app_0bcfd220f3_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    user_id UUID REFERENCES app_0bcfd220f3_users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    reference_type VARCHAR(50), -- 'counting', 'product', 'user'
    reference_id UUID,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX idx_notifications_user_id ON app_0bcfd220f3_notifications(user_id);
CREATE INDEX idx_notifications_company_id ON app_0bcfd220f3_notifications(company_id);
CREATE INDEX idx_notifications_read ON app_0bcfd220f3_notifications(read);
CREATE INDEX idx_notifications_reference ON app_0bcfd220f3_notifications(reference_type, reference_id);

-- Tabelas do sistema financeiro (para super admin)
CREATE TABLE app_0bcfd220f3_subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features TEXT[],
    max_users INTEGER DEFAULT -1, -- -1 = unlimited
    max_products INTEGER DEFAULT -1, -- -1 = unlimited
    max_storage_gb INTEGER DEFAULT -1, -- -1 = unlimited
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE app_0bcfd220f3_company_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES app_0bcfd220f3_companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES app_0bcfd220f3_subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE app_0bcfd220f3_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_subscription_id UUID NOT NULL REFERENCES app_0bcfd220f3_company_subscriptions(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sistema financeiro
CREATE INDEX idx_company_subscriptions_company_id ON app_0bcfd220f3_company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_status ON app_0bcfd220f3_company_subscriptions(status);
CREATE INDEX idx_invoices_subscription_id ON app_0bcfd220f3_invoices(company_subscription_id);
CREATE INDEX idx_invoices_status ON app_0bcfd220f3_invoices(status);
CREATE INDEX idx_invoices_due_date ON app_0bcfd220f3_invoices(due_date);
```

### Triggers e Functions
```sql
-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON app_0bcfd220f3_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON app_0bcfd220f3_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON app_0bcfd220f3_sectors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON app_0bcfd220f3_product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON app_0bcfd220f3_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countings_updated_at BEFORE UPDATE ON app_0bcfd220f3_countings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counting_items_updated_at BEFORE UPDATE ON app_0bcfd220f3_counting_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function para gerar número de fatura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number = 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_sequence')::text, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sequence para números de fatura
CREATE SEQUENCE invoice_sequence START 1;

-- Trigger para gerar número de fatura
CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON app_0bcfd220f3_invoices FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Function para atualizar estoque após aprovação de contagem
CREATE OR REPLACE FUNCTION update_stock_after_counting_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Só executa se o status mudou para 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Atualizar estoque dos produtos baseado na contagem
        UPDATE app_0bcfd220f3_products 
        SET current_stock = ci.counted_quantity,
            updated_at = NOW()
        FROM app_0bcfd220f3_counting_items ci
        WHERE ci.counting_id = NEW.id 
        AND ci.product_id = app_0bcfd220f3_products.id;
        
        -- Criar movimentações de estoque
        INSERT INTO app_0bcfd220f3_stock_movements (
            product_id,
            movement_type,
            quantity,
            quantity_before,
            quantity_after,
            reference_type,
            reference_id,
            notes,
            company_id,
            created_at
        )
        SELECT 
            ci.product_id,
            'counting',
            ci.difference,
            p.current_stock - ci.difference,
            p.current_stock,
            'counting',
            NEW.id,
            'Ajuste por contagem: ' || NEW.name,
            NEW.company_id,
            NOW()
        FROM app_0bcfd220f3_counting_items ci
        JOIN app_0bcfd220f3_products p ON p.id = ci.product_id
        WHERE ci.counting_id = NEW.id
        AND ci.difference != 0;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar estoque
CREATE TRIGGER update_stock_after_counting_approval_trigger 
    AFTER UPDATE ON app_0bcfd220f3_countings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_stock_after_counting_approval();
```

### Row Level Security (RLS)
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
ALTER TABLE app_0bcfd220f3_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir acesso completo por enquanto)
-- Em produção, implementar políticas mais restritivas baseadas em company_id e user roles

CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_companies FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_users FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_sectors FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_product_categories FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_products FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_countings FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_counting_items FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_counting_sectors FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_counting_products FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_stock_movements FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_messages FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_notifications FOR ALL USING (true);

-- Políticas para sistema financeiro (apenas super admin)
ALTER TABLE app_0bcfd220f3_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_0bcfd220f3_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_subscription_plans FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_company_subscriptions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON app_0bcfd220f3_invoices FOR ALL USING (true);
```

### Dados Iniciais
```sql
-- Inserir super admin
INSERT INTO app_0bcfd220f3_companies (id, name, cnpj, email, type, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'CloudBPO Admin', '00.000.000/0000-00', 'admin@cloudbpo.com', 'admin', 'active');

INSERT INTO app_0bcfd220f3_users (id, name, email, password, role, company_id, accessible_companies) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Super Admin', 'superadmin@cloudbpo.com', 'admin123', 'admin', '00000000-0000-0000-0000-000000000001', '{"00000000-0000-0000-0000-000000000001"}');

-- Inserir planos de assinatura padrão
INSERT INTO app_0bcfd220f3_subscription_plans (name, description, price, billing_cycle, features, max_users, max_products) VALUES
('Básico', 'Plano ideal para pequenas empresas', 99.00, 'monthly', '{"Até 5 usuários", "Suporte básico", "Relatórios básicos", "10GB de armazenamento"}', 5, 100),
('Premium', 'Plano para empresas em crescimento', 199.00, 'monthly', '{"Até 25 usuários", "Suporte prioritário", "Relatórios avançados", "100GB de armazenamento", "Integrações"}', 25, 1000),
('Empresarial', 'Plano completo para grandes empresas', 399.00, 'monthly', '{"Usuários ilimitados", "Suporte 24/7", "Relatórios personalizados", "Armazenamento ilimitado", "API completa"}', -1, -1);
```

## Scripts de Deploy e Manutenção

### Script de Instalação Completa
```bash
#!/bin/bash
# install.sh - Instalação completa do CloudBPO

set -e

echo "🚀 CloudBPO - Instalação Completa"
echo "=================================="

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Execute como root (sudo ./install.sh)"
    exit 1
fi

# Variáveis
DOMAIN=${1:-"www.cloudbpo.com"}
EMAIL=${2:-"admin@cloudbpo.com"}
DEPLOY_USER=${3:-"cloudbpo"}

echo "📋 Configurações:"
echo "   Domínio: $DOMAIN"
echo "   Email: $EMAIL"
echo "   Usuário: $DEPLOY_USER"
echo ""

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
echo "📦 Instalando dependências..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw fail2ban

# Instalar Node.js
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Criar usuário para deploy
echo "👤 Criando usuário de deploy..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
fi

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# Configurar fail2ban
echo "🛡️ Configurando fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p /var/www/cloudbpo
mkdir -p /var/backups/cloudbpo
mkdir -p /var/log/cloudbpo

# Configurar permissões
chown -R $DEPLOY_USER:$DEPLOY_USER /var/www/cloudbpo
chown -R $DEPLOY_USER:$DEPLOY_USER /var/backups/cloudbpo
chown -R $DEPLOY_USER:$DEPLOY_USER /var/log/cloudbpo

# Configurar Nginx
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/cloudbpo << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    root /var/www/cloudbpo/dist;
    index index.html;

    # SSL será configurado pelo Certbot
    
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

    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/cloudbpo/access.log;
    error_log /var/log/cloudbpo/error.log;
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/cloudbpo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

# Obter certificado SSL
echo "🔒 Configurando SSL..."
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# Configurar renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Reiniciar serviços
systemctl restart nginx
systemctl enable nginx

echo ""
echo "✅ Instalação base concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o Supabase"
echo "2. Clone o código do projeto"
echo "3. Execute o deploy"
echo ""
echo "🌐 Acesse: https://$DOMAIN"
```

### Script de Deploy Automatizado
```bash
#!/bin/bash
# deploy.sh - Deploy automatizado

set -e

# Configurações
REPO_URL="https://github.com/seu-usuario/cloudbpo.git"
DEPLOY_DIR="/var/www/cloudbpo"
BACKUP_DIR="/var/backups/cloudbpo"
LOG_FILE="/var/log/cloudbpo/deploy.log"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 Iniciando deploy do CloudBPO..."

# Backup da versão atual
if [ -d "$DEPLOY_DIR/dist" ]; then
    log "📦 Fazendo backup da versão atual..."
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
fi

# Clone/Pull do código
if [ -d "$DEPLOY_DIR/.git" ]; then
    log "🔄 Atualizando código..."
    cd "$DEPLOY_DIR"
    sudo -u cloudbpo git pull origin main
else
    log "📥 Clonando repositório..."
    sudo rm -rf "$DEPLOY_DIR"
    sudo -u cloudbpo git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# Verificar se existe .env
if [ ! -f ".env" ]; then
    log "⚠️ Arquivo .env não encontrado!"
    log "📝 Criando .env de exemplo..."
    sudo -u cloudbpo cp .env.example .env
    log "❗ Configure o arquivo .env antes de continuar!"
    exit 1
fi

# Instalar dependências
log "📦 Instalando dependências..."
sudo -u cloudbpo npm ci

# Build
log "🏗️ Fazendo build..."
sudo -u cloudbpo npm run build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    log "❌ Build falhou - diretório dist não encontrado!"
    exit 1
fi

# Ajustar permissões
log "🔐 Ajustando permissões..."
sudo chown -R www-data:www-data "$DEPLOY_DIR/dist"
sudo chmod -R 755 "$DEPLOY_DIR/dist"

# Testar configuração do Nginx
log "🔍 Testando configuração do Nginx..."
sudo nginx -t

# Reload Nginx
log "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

# Verificar se o site está respondendo
log "🌐 Verificando se o site está online..."
if curl -f -s https://www.cloudbpo.com > /dev/null; then
    log "✅ Deploy concluído com sucesso!"
    log "🌐 Site disponível em: https://www.cloudbpo.com"
else
    log "❌ Site não está respondendo!"
    exit 1
fi

# Limpar backups antigos (manter apenas os últimos 5)
log "🧹 Limpando backups antigos..."
find "$BACKUP_DIR" -name "backup-*" -type d | sort -r | tail -n +6 | xargs rm -rf

log "🎉 Deploy finalizado!"
```

### Script de Monitoramento
```bash
#!/bin/bash
# monitor.sh - Monitoramento do sistema

# Configurações
SITE_URL="https://www.cloudbpo.com"
EMAIL="admin@cloudbpo.com"
LOG_FILE="/var/log/cloudbpo/monitor.log"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Função para enviar alerta
send_alert() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" "$EMAIL"
    log "ALERT: $subject - $message"
}

# Verificar se o site está respondendo
if ! curl -f -s "$SITE_URL" > /dev/null; then
    send_alert "CloudBPO - Site Down" "O site $SITE_URL não está respondendo!"
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    send_alert "CloudBPO - Disk Space Warning" "Espaço em disco baixo: ${DISK_USAGE}%"
fi

# Verificar uso de memória
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
    send_alert "CloudBPO - Memory Warning" "Uso de memória alto: ${MEMORY_USAGE}%"
fi

# Verificar se o Nginx está rodando
if ! systemctl is-active --quiet nginx; then
    send_alert "CloudBPO - Nginx Down" "Nginx não está rodando!"
    systemctl start nginx
fi

# Verificar certificado SSL
CERT_DAYS=$(echo | openssl s_client -servername www.cloudbpo.com -connect www.cloudbpo.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2 | xargs -I {} date -d "{}" +%s)
CURRENT_DATE=$(date +%s)
DAYS_LEFT=$(( (CERT_DAYS - CURRENT_DATE) / 86400 ))

if [ "$DAYS_LEFT" -lt 30 ]; then
    send_alert "CloudBPO - SSL Certificate Expiring" "Certificado SSL expira em $DAYS_LEFT dias!"
fi

log "Monitor check completed - Site: OK, Disk: ${DISK_USAGE}%, Memory: ${MEMORY_USAGE}%, SSL: ${DAYS_LEFT} days"
```

## Configuração de Desenvolvimento Local

### Docker para Desenvolvimento (Opcional)
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# Expor porta
EXPOSE 3000

# Comando de desenvolvimento
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  cloudbpo-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    command: npm run dev
```

### Comandos de Desenvolvimento
```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check

# Testes (se configurados)
npm run test
```

---

Este documento fornece todas as especificações técnicas necessárias para deploy e manutenção do CloudBPO. Adapte conforme suas necessidades específicas de infraestrutura.