// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Product and Category Types
export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  min_stock?: number;
  max_stock?: number;
  current_stock?: number;
  cost?: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Sector Types
export interface Sector {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Counting Types
export interface Counting {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  assigned_to?: string;
  assigned_user?: User;
  sectors?: string[];
  sector_names?: string[];
  products?: string[];
  product_names?: string[];
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  approved_at?: string;
  approved_by?: string;
  share_link?: string;
}

export interface CountingItem {
  id: string;
  counting_id: string;
  product_id: string;
  product_name: string;
  sector_id: string;
  sector_name: string;
  expected_quantity?: number;
  counted_quantity?: number;
  unit: string;
  notes?: string;
  counted_by?: string;
  counted_at?: string;
  created_at: string;
  updated_at: string;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  assigned_user?: User;
  due_date?: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Message Types
export interface Message {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  from_user_id: string;
  from_user?: User;
  to_user_id?: string;
  to_user?: User;
  company_id: string;
  read: boolean;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  user_id: string;
  company_id: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

// Financial Types
export interface Subscription {
  id: string;
  company_id: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled';
  start_date: string;
  end_date: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

// Constants
export const USER_ROLES = ['admin', 'manager', 'employee'] as const;
export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const MESSAGE_PRIORITIES = ['low', 'medium', 'high'] as const;
export const COUNTING_STATUSES = ['pending', 'in_progress', 'completed', 'approved'] as const;
export const NOTIFICATION_TYPES = ['info', 'warning', 'error', 'success'] as const;
export const SUBSCRIPTION_PLANS = ['basic', 'premium', 'enterprise'] as const;
export const SUBSCRIPTION_STATUSES = ['active', 'inactive', 'cancelled'] as const;
export const PAYMENT_STATUSES = ['pending', 'completed', 'failed'] as const;

// Default Product Categories
export const DEFAULT_PRODUCT_CATEGORIES = [
  'Carnes',
  'Pescados y Mariscos',
  'Lácteos',
  'Verduras',
  'Frutas',
  'Granos y Cereales',
  'Condimentos y Especias',
  'Bebidas',
  'Panadería',
  'Congelados',
  'Enlatados',
  'Limpieza',
  'Otros'
] as const;

// Default Units
export const DEFAULT_UNITS = [
  'kg',
  'g',
  'lb',
  'oz',
  'l',
  'ml',
  'gal',
  'pcs',
  'box',
  'bag',
  'bottle',
  'can',
  'pack'
] as const;

// Type for form data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  company_name: string;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
}