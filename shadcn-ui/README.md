# CloudBPO - Sistema de Gestão de Inventário

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)

## 📋 Sobre o Projeto

CloudBPO é uma plataforma avançada de gerenciamento de inventário desenvolvida especificamente para a indústria de foodservice. A plataforma oferece funcionalidades completas para controle de estoque, contagens de inventário, gestão de usuários e integração com WhatsApp para notificações.

### ✨ Principais Funcionalidades

- 🔐 **Autenticação Segura** - Sistema de login com controle de acesso baseado em roles
- 📦 **Gestão de Produtos** - CRUD completo com categorização e controle de estoque
- 🏢 **Multi-empresa** - Suporte a múltiplas empresas com isolamento de dados
- 📱 **Interface Mobile** - Otimizada para contagens em dispositivos móveis
- 📊 **Dashboard Interativo** - Visão geral de tarefas e métricas importantes
- 🔄 **Contagens de Inventário** - Sistema completo de contagens com aprovação
- 💬 **Integração WhatsApp** - Notificações automáticas via WhatsApp
- 📈 **Relatórios Detalhados** - Exportação de dados e histórico de movimentações

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool moderno e rápido
- **Tailwind CSS** - Framework CSS utility-first
- **Shadcn/ui** - Componentes UI reutilizáveis
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones modernos

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security** - Segurança a nível de linha

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.tsx      # Layout principal
│   ├── Navbar.tsx      # Barra de navegação
│   └── ui/             # Componentes base (shadcn/ui)
├── contexts/           # Contextos React
│   ├── AuthContext.tsx # Autenticação
│   └── CompanyContext.tsx # Gestão de empresa
├── lib/                # Utilitários e configurações
│   ├── supabase.ts     # Cliente Supabase
│   ├── types.ts        # Definições de tipos
│   └── permissions.ts  # Sistema de permissões
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Products.tsx    # Gestão de produtos
│   ├── Countings.tsx   # Gestão de contagens
│   ├── Users.tsx       # Gestão de usuários
│   └── ...
└── App.tsx             # Componente principal
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- npm ou pnpm
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone <repository-url>
cd cloudbpo
```

### 2. Instale as dependências
```bash
pnpm install
# ou
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Configure o banco de dados
Execute os scripts SQL no painel do Supabase para criar as tabelas necessárias. Consulte o arquivo `MANUAL_TECNICO.md` para detalhes completos.

### 5. Execute o projeto
```bash
pnpm run dev
# ou
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 📊 Funcionalidades Detalhadas

### 🔐 Sistema de Autenticação
- Login seguro com validação
- Controle de acesso baseado em roles (admin, user)
- Suporte a múltiplas empresas por usuário
- Sessões persistentes

### 📦 Gestão de Produtos
- Cadastro completo de produtos
- Categorização por setores
- Controle de estoque mínimo/máximo
- Unidades de medida e fatores de conversão
- Histórico de movimentações

### 🔄 Sistema de Contagens
- Criação de contagens por setores
- Interface mobile otimizada
- Gestão automática de prazos
- Sistema de aprovação com ajustes
- Notificações via WhatsApp

### 📱 Interface Mobile
- Design responsivo
- Otimizada para tablets e smartphones
- Entrada rápida de dados
- Funciona offline (cache local)

### 📈 Dashboard e Relatórios
- Métricas em tempo real
- Gráficos interativos
- Exportação para Excel/CSV
- Filtros avançados

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm run dev

# Build para produção
pnpm run build

# Verificação de código
pnpm run lint

# Preview do build
pnpm run preview
```

## 🚀 Deploy

### Build de Produção
```bash
pnpm run build
```

### Plataformas Recomendadas
- **Vercel** - Deploy automático com GitHub
- **Netlify** - Deploy contínuo
- **Supabase Hosting** - Integração nativa

## 🔧 Configuração Avançada

### Supabase
1. Crie um novo projeto no Supabase
2. Configure as tabelas usando os scripts SQL fornecidos
3. Configure as políticas RLS para segurança
4. Obtenha as chaves de API

### Variáveis de Ambiente
```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Opcional - para features específicas
VITE_WHATSAPP_API_URL=url_da_api_whatsapp
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com Supabase**
   ```bash
   # Verifique as variáveis de ambiente
   echo $VITE_SUPABASE_URL
   ```

2. **Problemas de build**
   ```bash
   # Limpe o cache e reinstale
   rm -rf node_modules package-lock.json
   pnpm install
   ```

3. **Erros de TypeScript**
   ```bash
   # Verifique os tipos
   pnpm run lint
   ```

## 📝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- 📧 Email: suporte@cloudbpo.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Website: https://cloudbpo.com

## 🙏 Agradecimentos

- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)

---

**Desenvolvido com ❤️ pela equipe CloudBPO**