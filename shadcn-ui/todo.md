# Sistema de Contagem de Estoque BPO - MVP

## Funcionalidades Principais
1. **Autenticação e Multiempresas**
   - Login de usuários
   - Gestão de empresas (CNPJ)
   - Criação de usuários dentro do sistema

2. **Gestão Base**
   - CRUD de Produtos
   - CRUD de Setores
   - Relacionamento Produto-Setor

3. **Sistema de Contagem**
   - Criação de contagens (setor, funcionário, prazo, observações)
   - Link compartilhável para mobile
   - Interface mobile para contagem
   - Finalização e exportação Excel

4. **Dashboard**
   - Visão geral das contagens
   - Status e relatórios

## Arquivos a Criar

### 1. Configuração e Utilitários
- `src/lib/database.ts` - Simulação de banco de dados (localStorage)
- `src/lib/types.ts` - Tipos TypeScript
- `src/lib/utils-custom.ts` - Utilitários personalizados
- `src/contexts/AuthContext.tsx` - Contexto de autenticação

### 2. Páginas Principais
- `src/pages/Login.tsx` - Tela de login
- `src/pages/Dashboard.tsx` - Dashboard principal
- `src/pages/Companies.tsx` - Gestão de empresas
- `src/pages/Products.tsx` - Gestão de produtos
- `src/pages/Sectors.tsx` - Gestão de setores
- `src/pages/Countings.tsx` - Lista de contagens
- `src/pages/CreateCounting.tsx` - Criar nova contagem
- `src/pages/CountingMobile.tsx` - Interface mobile para contagem

### 3. Componentes
- `src/components/Layout.tsx` - Layout principal
- `src/components/Navbar.tsx` - Barra de navegação
- `src/components/CountingCard.tsx` - Card de contagem

## Prioridades MVP
1. Sistema de login básico
2. Gestão de empresas, produtos e setores
3. Criação de contagens
4. Interface mobile funcional
5. Exportação básica