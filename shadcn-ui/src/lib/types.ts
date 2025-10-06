// FIXED: Correct User interface with proper access control fields
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'viewer';
  companyId: string;
  accessibleCompanies: string[]; // Array of company IDs the user can access
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
}

// Company types - FIXED: Proper field names
export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  type?: 'cliente' | 'fornecedor' | 'parceiro' | 'other';
  createdAt: string;
  updatedAt?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  code?: string;
  description?: string;
  categoryId?: string;
  sectorId?: string;
  unit?: string;
  conversionFactor?: number;
  alternativeUnit?: string;
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  unitCost?: number;
  costPrice?: number;
  salePrice?: number;
  barcode?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
  // Legacy fields for backward compatibility
  category_id?: string;
  sector_id?: string;
  conversion_factor?: number;
  alternative_unit?: string;
  min_stock?: number;
  max_stock?: number;
  current_stock?: number;
  unit_cost?: number;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Product Category
export interface ProductCategory {
  id: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

// Sector
export interface Sector {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

// Stock Movement
export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  reference?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

// Counting
export interface Counting {
  id: string;
  internalId: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'expired';
  type?: string;
  sectorId?: string;
  createdBy: string;
  shareLink?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

// Counting Item
export interface CountingItem {
  id: string;
  countingId: string;
  productId: string;
  expectedQuantity?: number;
  countedQuantity?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Subscription plan types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  max_users: number;
  max_products: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Company subscription types
export interface CompanySubscription {
  id: string;
  companyId: string;
  plan: string;
  status: 'active' | 'pending' | 'overdue' | 'cancelled';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  companyId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  id: string;
  title: string;
  content: string;
  senderId: string;
  companyId: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId?: string;
  companyId: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Product categories - FIXED: Export this constant
export const DEFAULT_PRODUCT_CATEGORIES = [
  'Carnes',
  'Aves',
  'Peixes e Frutos do Mar',
  'Laticínios',
  'Vegetais',
  'Frutas',
  'Grãos e Cereais',
  'Temperos e Condimentos',
  'Bebidas',
  'Congelados',
  'Enlatados',
  'Padaria',
  'Limpeza',
  'Descartáveis',
  'Outros'
] as const;

// Product units
export const PRODUCT_UNITS = [
  'kg',
  'g',
  'L',
  'mL',
  'unidade',
  'caixa',
  'pacote',
  'lata',
  'garrafa',
  'saco'
] as const;

// User roles
export const USER_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'employee', label: 'Funcionário' },
  { value: 'viewer', label: 'Visualizador' }
] as const;

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;