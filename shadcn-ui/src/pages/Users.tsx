import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users as UsersIcon, 
  Shield,
  User,
  Eye,
  EyeOff,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { db } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType, Company } from '@/lib/types';
import { toast } from 'sonner';
import { canManageUsers } from '@/lib/permissions';
import { supabase, TABLES } from '@/lib/supabase';

const USER_ROLES = {
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Funcionário',
  viewer: 'Visualizador'
};

export default function UsersPage() {
  const { authState } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Enhanced: Complete debugging and synchronization states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugStatus, setDebugStatus] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [connectionChecking, setConnectionChecking] = useState(true);
  const [saveMethod, setSaveMethod] = useState<'supabase' | 'localStorage' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as keyof typeof USER_ROLES,
    companyId: '',
    accessibleCompanies: [] as string[]
  });

  // Check if current user can manage users (only super admin)
  const hasPermission = canManageUsers(authState.user);

  // Get companies based on context - ALL companies for user creation, user's companies for normal use
  const getCompaniesForContext = (): Company[] => {
    // During user creation (dialog open), show ALL companies available
    if (isDialogOpen) {
      console.log('📊 USER CREATION MODE: Showing all companies:', companies.length);
      return companies;
    }

    // For normal system use, show only user's accessible companies
    if (authState.user) {
      const userAccessibleCompanyIds = authState.user.accessibleCompanies || [authState.user.companyId];
      const accessibleCompanies = companies.filter(company => 
        userAccessibleCompanyIds.includes(company.id)
      );
      
      console.log('👤 NORMAL MODE: User accessible companies:', {
        user: authState.user.name,
        total: companies.length,
        accessible: accessibleCompanies.length,
        companies: accessibleCompanies.map(c => ({ id: c.id, name: c.name }))
      });
      
      return accessibleCompanies;
    }

    return [];
  };

  useEffect(() => {
    if (!hasPermission) {
      return; // Don't load data if no permission
    }
    loadData();
    checkSupabaseConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkSupabaseConnection, 30000);
    return () => clearInterval(interval);
  }, [hasPermission]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, selectedRole, selectedCompany]);

  // Enhanced: Comprehensive Supabase connection testing
  const checkSupabaseConnection = async () => {
    try {
      setConnectionChecking(true);
      console.log('🔍 CHECKING SUPABASE CONNECTION...');
      
      // Check if supabase client exists and has configuration
      if (!supabase || !supabase.supabaseUrl || !supabase.supabaseKey) {
        console.log('❌ Supabase client not configured');
        setIsSupabaseConnected(false);
        return;
      }
      
      // Test actual connection with users table
      console.log('🔍 Testing connection to table:', TABLES.USERS);
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        setIsSupabaseConnected(false);
      } else {
        console.log('✅ Supabase connected successfully');
        setIsSupabaseConnected(true);
      }
    } catch (error) {
      console.error('❌ Supabase connection error:', error);
      setIsSupabaseConnected(false);
    } finally {
      setConnectionChecking(false);
    }
  };

  // Enhanced: Complete user verification in database
  const verifyUserInDatabase = async (email: string): Promise<boolean> => {
    try {
      console.log('🔍 VERIFYING USER IN DATABASE:', email);
      
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('❌ VERIFICATION ERROR:', error);
        return false;
      }
      
      if (data) {
        console.log('✅ USER CONFIRMED IN DATABASE:', {
          id: data.id,
          name: data.name,
          email: data.email,
          created_at: data.created_at
        });
        return true;
      } else {
        console.log('❌ USER NOT FOUND IN DATABASE');
        return false;
      }
    } catch (error) {
      console.error('❌ VERIFICATION FAILED:', error);
      return false;
    }
  };

  // Enhanced: Complete data loading with detailed logging
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 LOADING DATA - Starting...');
      
      // Use async methods to load data from Supabase
      const [loadedUsers, loadedCompanies] = await Promise.all([
        db.getUsersAsync(),
        db.getCompaniesAsync()
      ]);
      
      console.log('📊 LOADED DATA:', {
        users: loadedUsers.length,
        companies: loadedCompanies.length
      });
      
      setUsers(loadedUsers);
      setCompanies(loadedCompanies);
      
      // Set default company based on available companies (for user creation)
      if (!formData.companyId && loadedCompanies.length > 0) {
        const defaultCompany = loadedCompanies[0];
        console.log('🏢 SETTING DEFAULT COMPANY:', defaultCompany.name);
        
        setFormData(prev => ({ 
          ...prev, 
          companyId: defaultCompany.id,
          accessibleCompanies: [defaultCompany.id]
        }));
      }
      
      console.log('✅ DATA LOADING COMPLETED');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function with visual feedback
  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 MANUAL REFRESH INITIATED');
      
      // Force reload data
      await loadData();
      
      // Show success message
      toast.success('Lista de usuários atualizada!');
      console.log('✅ MANUAL REFRESH COMPLETED');
      
    } catch (error) {
      console.error('❌ MANUAL REFRESH FAILED:', error);
      toast.error('Erro ao atualizar lista');
    } finally {
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Company filter
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(user => {
        // Check if user has access to the selected company
        if (user.accessibleCompanies && user.accessibleCompanies.length > 0) {
          return user.accessibleCompanies.includes(selectedCompany);
        }
        // Fallback to primary company for legacy users
        return user.companyId === selectedCompany;
      });
    }

    setFilteredUsers(filtered);
  };

  const resetForm = () => {
    // Reset to default values with first available company
    const defaultCompanies = companies.length > 0 ? [companies[0].id] : [];
    
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      companyId: companies.length > 0 ? companies[0].id : '',
      accessibleCompanies: defaultCompanies
    });
    setEditingUser(null);
    setShowPassword(false);
    setDebugStatus('');
    setSaveMethod(null);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  // Handle company access selection during user creation
  const handleCompanyAccess = (companyId: string, checked: boolean) => {
    console.log('handleCompanyAccess called:', { companyId, checked });
    
    setFormData(prev => {
      let newAccessibleCompanies = [...prev.accessibleCompanies];
      
      if (checked) {
        // Add company if not already included
        if (!newAccessibleCompanies.includes(companyId)) {
          newAccessibleCompanies.push(companyId);
          console.log('Added company:', companyId);
        }
      } else {
        // Remove company
        newAccessibleCompanies = newAccessibleCompanies.filter(id => id !== companyId);
        console.log('Removed company:', companyId);
      }
      
      console.log('New accessible companies:', newAccessibleCompanies);
      
      // Ensure at least one company is selected
      if (newAccessibleCompanies.length === 0 && companies.length > 0) {
        toast.error('O usuário deve ter acesso a pelo menos uma empresa');
        return prev; // Don't update if no companies selected
      }
      
      // Update primary company if it's no longer in accessible companies
      let newCompanyId = prev.companyId;
      if (!newAccessibleCompanies.includes(prev.companyId) && newAccessibleCompanies.length > 0) {
        newCompanyId = newAccessibleCompanies[0];
        console.log('Updated primary company to:', newCompanyId);
      }
      
      const newFormData = {
        ...prev,
        companyId: newCompanyId,
        accessibleCompanies: newAccessibleCompanies
      };
      
      console.log('Updated form data:', newFormData);
      return newFormData;
    });
  };

  // COMPLETELY ENHANCED: Full synchronization and verification flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      console.log('🚀 STARTING COMPLETE USER CREATION FLOW');
      
      // STEP 1: Validation
      setDebugStatus('🔍 Validando dados do formulário...');
      
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!formData.email.trim()) {
        throw new Error('Email é obrigatório');
      }
      if (!formData.email.includes('@')) {
        throw new Error('Email deve ter formato válido');
      }
      if (!formData.role) {
        throw new Error('Função é obrigatória');
      }
      if (!formData.companyId) {
        throw new Error('Empresa principal é obrigatória');
      }
      if (!editingUser && !formData.password.trim()) {
        throw new Error('Senha é obrigatória para novos usuários');
      }
      if (formData.password && formData.password.length < 4) {
        throw new Error('Senha deve ter pelo menos 4 caracteres');
      }
      if (!formData.accessibleCompanies || formData.accessibleCompanies.length === 0) {
        throw new Error('Usuário deve ter acesso a pelo menos uma empresa');
      }
      
      // Check if email already exists
      const existingUser = users.find(u => 
        u.email === formData.email.trim() && u.id !== editingUser?.id
      );
      if (existingUser) {
        throw new Error('Já existe um usuário com este email');
      }
      
      console.log('✅ VALIDATION PASSED');
      setDebugStatus('✅ Dados validados com sucesso!');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // STEP 2: Check Supabase connection
      setDebugStatus('🌐 Verificando conexão com Supabase...');
      await checkSupabaseConnection();
      
      if (isSupabaseConnected) {
        console.log('✅ SUPABASE CONNECTED - Will save to database');
        setDebugStatus('✅ Supabase conectado - salvando no banco de dados');
      } else {
        console.log('⚠️ SUPABASE DISCONNECTED - Will save locally');
        setDebugStatus('⚠️ Supabase desconectado - salvando localmente');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // STEP 3: Prepare user data
      setDebugStatus('📝 Preparando dados do usuário...');
      
      const userData: UserType = {
        id: editingUser?.id || crypto.randomUUID(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        companyId: formData.companyId,
        accessibleCompanies: formData.accessibleCompanies,
        password: editingUser && !formData.password.trim() 
          ? editingUser.password 
          : formData.password.trim(),
        createdAt: editingUser?.createdAt || new Date().toISOString()
      };

      console.log('📝 PREPARED USER DATA:', {
        ...userData,
        password: userData.password ? '***' : 'NO PASSWORD'
      });
      
      setDebugStatus('✅ Dados preparados com sucesso!');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // STEP 4: Save user data with detailed logging
      if (isSupabaseConnected) {
        try {
          setDebugStatus('💾 Salvando no Supabase...');
          console.log('💾 ATTEMPTING SUPABASE SAVE...');
          
          await db.saveUserAsync(userData);
          
          console.log('✅ SUPABASE SAVE COMPLETED');
          setDebugStatus('✅ Usuário salvo no Supabase!');
          setSaveMethod('supabase');
          
          // STEP 5: Verify the save was successful
          setDebugStatus('🔍 Verificando se foi salvo no banco...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const isVerified = await verifyUserInDatabase(userData.email);
          if (!isVerified) {
            throw new Error('Usuário não foi encontrado no banco após salvamento');
          }
          
          console.log('✅ USER VERIFIED IN DATABASE');
          setDebugStatus('✅ Usuário confirmado no banco de dados!');
          
        } catch (supabaseError) {
          console.error('❌ SUPABASE SAVE FAILED:', supabaseError);
          setDebugStatus('⚠️ Supabase falhou, salvando localmente...');
          
          // Fallback to localStorage
          const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
          const existingIndex = localUsers.findIndex((u: UserType) => u.id === userData.id);
          
          if (existingIndex >= 0) {
            localUsers[existingIndex] = userData;
          } else {
            localUsers.push(userData);
          }
          
          localStorage.setItem('users', JSON.stringify(localUsers));
          setSaveMethod('localStorage');
          setDebugStatus('✅ Usuário salvo no localStorage!');
          
          toast.warning('Usuário salvo localmente. Conecte o Supabase para sincronizar.');
        }
      } else {
        // Save to localStorage only
        setDebugStatus('💾 Salvando no localStorage (modo offline)...');
        
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const existingIndex = localUsers.findIndex((u: UserType) => u.id === userData.id);
        
        if (existingIndex >= 0) {
          localUsers[existingIndex] = userData;
        } else {
          localUsers.push(userData);
        }
        
        localStorage.setItem('users', JSON.stringify(localUsers));
        setSaveMethod('localStorage');
        setDebugStatus('✅ Usuário salvo no localStorage!');
        
        toast.warning('Usuário salvo localmente. Conecte o Supabase para sincronizar.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // STEP 6: Reload data and update interface
      setDebugStatus('🔄 Recarregando lista de usuários...');
      console.log('🔄 RELOADING USER LIST...');
      
      await loadData();
      
      console.log('✅ USER LIST RELOADED');
      setDebugStatus('✅ Lista de usuários atualizada!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // STEP 7: Final success
      setDebugStatus('🎉 Processo concluído com sucesso!');
      
      // Close dialog and reset
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 2000);
      
      const action = editingUser ? 'atualizado' : 'criado';
      const methodText = saveMethod === 'localStorage' ? ' (salvo localmente)' : '';
      toast.success(`Usuário ${action} com sucesso!${methodText}`);
      
      // Only show credentials for new users
      if (!editingUser) {
        toast.info(`Credenciais de acesso:\nEmail: ${userData.email}\nSenha: ${formData.password}`, {
          duration: 15000,
          description: 'Anote estas credenciais para o usuário'
        });
      } else if (formData.password.trim()) {
        toast.info(`Nova senha definida: ${formData.password}`, {
          duration: 10000,
          description: 'Nova senha para o usuário'
        });
      }
      
    } catch (error) {
      console.error('❌ COMPLETE USER CREATION FAILED:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setDebugStatus(`❌ Erro: ${errorMessage}`);
      toast.error(`Erro ao processar usuário: ${errorMessage}`);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    
    // For editing, show user's current accessible companies
    const userAccessibleCompanies = user.accessibleCompanies && user.accessibleCompanies.length > 0 
      ? user.accessibleCompanies
      : [user.companyId];
      
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Always start with empty password for editing
      role: user.role as keyof typeof USER_ROLES,
      companyId: user.companyId,
      accessibleCompanies: userAccessibleCompanies
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    // Prevent deleting current user
    if (userId === authState.user?.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }

    // Prevent deleting super admin
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.email === 'superadmin@cloudbpo.com') {
      toast.error('Não é possível excluir o super administrador');
      return;
    }

    try {
      console.log('🗑️ Deleting user:', userId);
      await db.deleteUserAsync(userId);
      await loadData();
      toast.success('Usuário excluído!');
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Empresa não encontrada';
  };

  const getUserAccessibleCompanies = (user: UserType) => {
    if (user.accessibleCompanies && user.accessibleCompanies.length > 0) {
      return user.accessibleCompanies.map(id => getCompanyName(id));
    }
    // Fallback for legacy users
    return [getCompanyName(user.companyId)];
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const getUserStats = () => {
    const total = users.length;
    const byRole = Object.keys(USER_ROLES).reduce((acc, role) => {
      acc[role] = users.filter(u => u.role === role).length;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byRole };
  };

  // If user doesn't have permission, show access denied
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          <p className="text-sm text-gray-500 mt-2">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const stats = getUserStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
          
          {/* Connection status with refresh button */}
          <div className="flex items-center mt-2 text-sm">
            {connectionChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-gray-500">Verificando conexão Supabase...</span>
              </>
            ) : isSupabaseConnected ? (
              <>
                <Database className="h-4 w-4 mr-2 text-green-600" />
                <span className="text-green-600 font-medium">🟢 Supabase Conectado</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="ml-2 h-6 px-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2 text-red-600" />
                <span className="text-red-600 font-medium">🔴 Supabase Desconectado</span>
                <ExternalLink className="h-3 w-3 ml-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="ml-2 h-6 px-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Atualize as informações do usuário' : 'Adicione um novo usuário ao sistema'}
              </DialogDescription>
            </DialogHeader>
            
            {/* Connection warning with detailed instructions */}
            {!isSupabaseConnected && (
              <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="font-medium mb-1">⚠️ Supabase não está conectado!</div>
                  <div className="text-sm">
                    Os dados serão salvos temporariamente no navegador. 
                    <br />
                    <strong>Para salvar permanentemente:</strong> Clique no botão "Supabase" no canto superior direito da tela.
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Real-time debug status display */}
            {(debugStatus || isSubmitting) && (
              <Alert className={`mb-4 ${debugStatus.includes('❌') ? 'border-red-200 bg-red-50' : 
                                      debugStatus.includes('✅') || debugStatus.includes('🎉') ? 'border-green-200 bg-green-50' : 
                                      'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-center">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {debugStatus.includes('✅') && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                  {debugStatus.includes('🎉') && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                  {debugStatus.includes('❌') && <AlertCircle className="h-4 w-4 mr-2 text-red-600" />}
                  <AlertDescription className="font-medium">
                    {debugStatus || 'Processando...'}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do usuário"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="usuario@exemplo.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Função *</Label>
                  <Select value={formData.role} onValueChange={(value: keyof typeof USER_ROLES) => setFormData(prev => ({ ...prev, role: value }))} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_ROLES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="companyId">Empresa Principal *</Label>
                  <Select value={formData.companyId} onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show companies that are selected for the user */}
                      {companies
                        .filter(company => formData.accessibleCompanies.includes(company.id))
                        .map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Acesso às Empresas *</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {/* Show ALL companies during user creation */}
                  {companies.map((company) => {
                    const isChecked = formData.accessibleCompanies.includes(company.id);
                    
                    return (
                      <div key={company.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`company-${company.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            handleCompanyAccess(company.id, checked as boolean);
                          }}
                          disabled={isSubmitting}
                        />
                        <Label 
                          htmlFor={`company-${company.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{company.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {company.type}
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione as empresas que o usuário poderá acessar
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="password">
                    {editingUser ? 'Nova Senha (deixe vazio para manter atual)' : 'Senha *'}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    disabled={isSubmitting}
                  >
                    Gerar Senha
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingUser ? "Deixe vazio para manter senha atual" : "Senha do usuário"}
                    required={!editingUser}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {editingUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Deixe o campo vazio para manter a senha atual do usuário
                  </p>
                )}
              </div>

              {/* Connection instructions */}
              {!isSupabaseConnected && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center mb-1">
                    <Database className="h-4 w-4 mr-1" />
                    <strong>Como conectar o Supabase:</strong>
                  </div>
                  <div className="text-xs">
                    1. Clique no botão "Supabase" no canto superior direito da tela<br/>
                    2. Configure sua conexão com o banco de dados<br/>
                    3. Após conectar, os usuários serão salvos permanentemente
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      {editingUser ? 'Atualizar' : 'Criar'}
                      {!isSupabaseConnected && (
                        <span className="ml-1 text-xs">(Local)</span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.byRole.admin || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerentes</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.byRole.manager || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <UsersIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.byRole.employee || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {Object.entries(USER_ROLES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Empresa Principal</TableHead>
                  <TableHead>Acesso às Empresas</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = authState.user?.id === user.id;
                  const isSuperAdmin = user.email === 'superadmin@cloudbpo.com';
                  const accessibleCompanies = getUserAccessibleCompanies(user);
                  
                  return (
                    <TableRow key={user.id} className={isCurrentUser ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <div className="font-medium flex items-center">
                              {user.name}
                              {isSuperAdmin && (
                                <Shield className="h-4 w-4 ml-2 text-red-600" />
                              )}
                            </div>
                            {isCurrentUser && (
                              <div className="text-xs text-blue-600">Você</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {USER_ROLES[user.role as keyof typeof USER_ROLES]}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCompanyName(user.companyId)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {accessibleCompanies.slice(0, 2).map((companyName, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {companyName}
                            </Badge>
                          ))}
                          {accessibleCompanies.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{accessibleCompanies.length - 2} mais
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {!isCurrentUser && !isSuperAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o usuário "{user.name}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <UsersIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}