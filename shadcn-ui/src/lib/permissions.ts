import { User } from './types';

export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.email === 'superadmin@cloudbpo.com';
}

export function canManageCompanies(user: User | null): boolean {
  if (!user) return false;
  return user.email === 'superadmin@cloudbpo.com';
}

export function canViewReports(user: User | null): boolean {
  if (!user) return false;
  return ['admin', 'manager'].includes(user.role) || user.email === 'superadmin@cloudbpo.com';
}

export function canViewFinancial(user: User | null): boolean {
  if (!user) return false;
  return user.email === 'superadmin@cloudbpo.com';
}

export function canManageFinancial(user: User | null): boolean {
  if (!user) return false;
  return user.email === 'superadmin@cloudbpo.com';
}

export function canManageProducts(user: User | null): boolean {
  if (!user) return false;
  return ['admin', 'manager', 'employee'].includes(user.role) || user.email === 'superadmin@cloudbpo.com';
}

export function canManageCountings(user: User | null): boolean {
  if (!user) return false;
  return ['admin', 'manager', 'employee'].includes(user.role) || user.email === 'superadmin@cloudbpo.com';
}

export function canManageTasks(user: User | null): boolean {
  if (!user) return false;
  return ['admin', 'manager'].includes(user.role) || user.email === 'superadmin@cloudbpo.com';
}

export function canViewDashboard(user: User | null): boolean {
  if (!user) return false;
  return true; // All authenticated users can view dashboard
}

export function canAccessProducts(user: User | null): boolean {
  return user !== null;
}

export function canAccessSectors(user: User | null): boolean {
  return user !== null;
}

export function canAccessCountings(user: User | null): boolean {
  return user !== null;
}

export function canAccessMessages(user: User | null): boolean {
  return user !== null;
}

export function canAccessNotifications(user: User | null): boolean {
  return user !== null;
}

export function canSwitchCompanies(user: User | null): boolean {
  if (!user) return false;
  const accessibleCompanies = user.accessibleCompanies || [user.companyId];
  return accessibleCompanies.length > 1;
}

// Role display names in Portuguese
export const ROLE_NAMES = {
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Funcionário',
  viewer: 'Visualizador'
};

export function getRoleDisplayName(role: string): string {
  return ROLE_NAMES[role as keyof typeof ROLE_NAMES] || 'Desconhecido';
}

// Get accessible menu items based on user permissions
export function getAccessibleMenuItems(user: User | null) {
  if (!user) return [];

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      accessible: true,
    },
    {
      name: 'Produtos',
      path: '/products',
      icon: 'Package',
      accessible: canAccessProducts(user),
    },
    {
      name: 'Setores',
      path: '/sectors',
      icon: 'Building2',
      accessible: canAccessSectors(user),
    },
    {
      name: 'Contagens',
      path: '/countings',
      icon: 'ClipboardList',
      accessible: canAccessCountings(user),
    },
    {
      name: 'Mensagens',
      path: '/messages',
      icon: 'MessageSquare',
      accessible: canAccessMessages(user),
    },
    {
      name: 'Notificações',
      path: '/notifications',
      icon: 'Bell',
      accessible: canAccessNotifications(user),
    },
    {
      name: 'Usuários',
      path: '/users',
      icon: 'Users',
      accessible: canManageUsers(user),
    },
    {
      name: 'Empresas',
      path: '/companies',
      icon: 'Building',
      accessible: canManageCompanies(user),
    },
    {
      name: 'Financeiro',
      path: '/financial',
      icon: 'CreditCard',
      accessible: canManageFinancial(user),
    },
  ];

  return menuItems.filter(item => item.accessible);
}