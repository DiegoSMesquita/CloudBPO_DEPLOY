import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  MessageSquare,
  CreditCard,
  Building,
  ClipboardList,
  Menu,
  X,
  Shield,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { supabase, TABLES } from '@/lib/supabase';
import { Company } from '@/lib/types';
import { toast } from 'sonner';
import { format, isAfter, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Import CloudBPO logos
import logoAzul from '@/assets/images/logo-azul.png';
import logoBranco from '@/assets/images/logo-branco.png';
import iconeAzul from '@/assets/images/icone-azul.png';
import iconeBranco from '@/assets/images/icone-branco.png';

// 🔔 SISTEMA DE NOTIFICAÇÕES COMPLETO
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  countingId?: string;
  read: boolean;
  createdAt: string;
}

interface CountingNotification {
  id: string;
  name: string;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  employee_name?: string;
  expiresAt?: string;
}

export default function Navbar() {
  const { authState, logout, setCompany } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🔔 Estados para notificações
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    loadCompanies();
    if (authState.company?.id) {
      loadNotifications();
      // Verificar notificações a cada 2 minutos
      const interval = setInterval(() => {
        checkForNewNotifications();
      }, 120000);
      return () => clearInterval(interval);
    }
  }, [authState.company]);

  // 🚨 FIXED: Load only companies the user has access to
  const loadCompanies = async () => {
    try {
      console.log('🔍 LOADING COMPANIES FOR USER ACCESS CONTROL');
      
      // Get all companies from database
      const allCompanies = await db.getCompaniesAsync();
      console.log('📊 Total companies in database:', allCompanies.length);
      
      if (!authState.user) {
        console.log('❌ No authenticated user');
        setCompanies([]);
        return;
      }

      // 🚨 CRITICAL FIX: Filter companies based on user access
      let accessibleCompanies: Company[] = [];

      // Super admin can access ALL companies
      if (authState.user.email === 'superadmin@cloudbpo.com') {
        accessibleCompanies = allCompanies;
        console.log('👑 Super admin - access to all companies:', accessibleCompanies.length);
      } else {
        // Regular users can only access their assigned companies
        const userAccessibleCompanyIds = authState.user.accessibleCompanies || [authState.user.companyId];
        
        accessibleCompanies = allCompanies.filter(company => 
          userAccessibleCompanyIds.includes(company.id)
        );
        
        console.log('👤 Regular user access control:', {
          user: authState.user.name,
          email: authState.user.email,
          userAccessibleCompanyIds,
          totalCompanies: allCompanies.length,
          accessibleCompanies: accessibleCompanies.length,
          companies: accessibleCompanies.map(c => ({ id: c.id, name: c.name }))
        });
      }

      setCompanies(accessibleCompanies);
      
      // Validate current company access
      if (authState.company && !accessibleCompanies.find(c => c.id === authState.company?.id)) {
        console.log('⚠️ Current company is not accessible, switching to first available');
        if (accessibleCompanies.length > 0) {
          await setCompany(accessibleCompanies[0]);
          toast.warning(`Acesso à empresa anterior negado. Alterado para: ${accessibleCompanies[0].name}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading companies:', error);
      toast.error('Erro ao carregar empresas');
    }
  };

  // 🔔 CARREGAR NOTIFICAÇÕES DO BANCO
  const loadNotifications = async () => {
    if (!authState.company?.id) return;
    
    try {
      setLoadingNotifications(true);
      console.log('🔔 Loading notifications for company:', authState.company.id);
      
      // Carregar notificações salvas
      const { data: savedNotifications, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('company_id', authState.company.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('❌ Error loading notifications:', error);
      }
      
      // Mapear notificações salvas
      const mappedNotifications: Notification[] = (savedNotifications || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        countingId: n.reference_id,
        read: n.read || false,
        createdAt: n.created_at
      }));
      
      // Gerar notificações automáticas de contagens
      const automaticNotifications = await generateAutomaticNotifications();
      
      // Combinar notificações
      const allNotifications = [...automaticNotifications, ...mappedNotifications];
      
      // Remover duplicatas por ID
      const uniqueNotifications = allNotifications.filter((notification, index, self) => 
        index === self.findIndex(n => n.id === notification.id)
      );
      
      // Ordenar por data
      uniqueNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(uniqueNotifications);
      
      // 🔧 CORREÇÃO: Calcular unreadCount corretamente
      const newUnreadCount = uniqueNotifications.filter(n => !n.read).length;
      setUnreadCount(newUnreadCount);
      
      console.log('✅ Notifications loaded:', uniqueNotifications.length, 'Unread:', newUnreadCount);
      
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // 🔔 GERAR NOTIFICAÇÕES AUTOMÁTICAS BASEADAS EM CONTAGENS
  const generateAutomaticNotifications = async (): Promise<Notification[]> => {
    if (!authState.company?.id) return [];
    
    try {
      console.log('🔔 Generating automatic notifications...');
      
      // Buscar contagens relevantes
      const { data: countings, error } = await supabase
        .from(TABLES.COUNTINGS)
        .select('*')
        .eq('company_id', authState.company.id)
        .in('status', ['completed', 'expired', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('❌ Error fetching countings for notifications:', error);
        return [];
      }
      
      const notifications: Notification[] = [];
      const now = new Date();
      
      // 🔧 CORREÇÃO: Carregar estado de leitura do localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      
      for (const counting of countings || []) {
        // Notificação para contagens concluídas (últimas 24h)
        if (counting.status === 'completed' && counting.completed_at) {
          const completedAt = new Date(counting.completed_at);
          const hoursAgo = differenceInHours(now, completedAt);
          
          if (hoursAgo <= 24) {
            const notificationId = `completed_${counting.id}`;
            notifications.push({
              id: notificationId,
              title: 'Contagem Concluída',
              message: `A contagem "${counting.name}" foi concluída e aguarda aprovação.`,
              type: 'success',
              countingId: counting.id,
              read: readNotifications.includes(notificationId),
              createdAt: counting.completed_at
            });
          }
        }
        
        // Notificação para contagens expiradas
        if (counting.status === 'expired') {
          const notificationId = `expired_${counting.id}`;
          notifications.push({
            id: notificationId,
            title: 'Contagem Expirada',
            message: `A contagem "${counting.name}" expirou e precisa ser reativada.`,
            type: 'error',
            countingId: counting.id,
            read: readNotifications.includes(notificationId),
            createdAt: counting.updated_at || counting.created_at
          });
        }
        
        // Notificação para contagens próximas do prazo (2 horas)
        if (counting.status === 'in_progress' && counting.scheduled_date && counting.scheduled_time) {
          const scheduledDateTime = new Date(`${counting.scheduled_date}T${counting.scheduled_time}`);
          const hoursUntilDeadline = differenceInHours(scheduledDateTime, now);
          const minutesUntilDeadline = differenceInMinutes(scheduledDateTime, now);
          
          if (hoursUntilDeadline <= 2 && hoursUntilDeadline >= 0) {
            const notificationId = `deadline_${counting.id}`;
            notifications.push({
              id: notificationId,
              title: 'Contagem Próxima do Prazo',
              message: `A contagem "${counting.name}" expira em ${hoursUntilDeadline}h ${minutesUntilDeadline % 60}min.`,
              type: 'warning',
              countingId: counting.id,
              read: readNotifications.includes(notificationId),
              createdAt: new Date().toISOString()
            });
          }
        }
      }
      
      console.log('✅ Generated automatic notifications:', notifications.length);
      return notifications;
      
    } catch (error) {
      console.error('❌ Error generating automatic notifications:', error);
      return [];
    }
  };

  // 🔔 VERIFICAR NOVAS NOTIFICAÇÕES
  const checkForNewNotifications = async () => {
    await loadNotifications();
  };

  // 🔔 MARCAR NOTIFICAÇÃO COMO LIDA
  const markAsRead = async (notificationId: string) => {
    try {
      console.log('🔔 Marking notification as read:', notificationId);
      
      // Se é uma notificação automática (baseada em contagem), salvar no localStorage
      if (notificationId.startsWith('completed_') || 
          notificationId.startsWith('expired_') || 
          notificationId.startsWith('deadline_')) {
        
        // 🔧 CORREÇÃO: Atualizar localStorage
        const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        if (!readNotifications.includes(notificationId)) {
          readNotifications.push(notificationId);
          localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
        }
        
        // Marcar como lida localmente
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      
      // Para notificações salvas no banco
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) {
        console.error('❌ Error marking notification as read:', error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // 🔧 CORREÇÃO CRÍTICA: MARCAR TODAS COMO LIDAS
  const markAllAsRead = async () => {
    try {
      console.log('🔔 Marking all notifications as read...');
      
      // 1. Identificar notificações automáticas e salvas
      const automaticNotificationIds: string[] = [];
      const savedNotificationIds: string[] = [];
      
      notifications.forEach(n => {
        if (n.id.startsWith('completed_') || 
            n.id.startsWith('expired_') || 
            n.id.startsWith('deadline_')) {
          automaticNotificationIds.push(n.id);
        } else {
          savedNotificationIds.push(n.id);
        }
      });
      
      // 2. Atualizar localStorage para notificações automáticas
      if (automaticNotificationIds.length > 0) {
        const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const updatedReadNotifications = [...new Set([...readNotifications, ...automaticNotificationIds])];
        localStorage.setItem('readNotifications', JSON.stringify(updatedReadNotifications));
        console.log('✅ Updated localStorage with automatic notifications:', automaticNotificationIds.length);
      }
      
      // 3. Atualizar banco para notificações salvas
      if (savedNotificationIds.length > 0) {
        const { error } = await supabase
          .from(TABLES.NOTIFICATIONS)
          .update({ read: true, read_at: new Date().toISOString() })
          .in('id', savedNotificationIds);
        
        if (error) {
          console.error('❌ Error marking saved notifications as read:', error);
        } else {
          console.log('✅ Updated database notifications:', savedNotificationIds.length);
        }
      }
      
      // 4. Atualizar estado local IMEDIATAMENTE
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      console.log('✅ All notifications marked as read successfully');
      
      // 5. Mostrar feedback visual
      toast.success('Todas as notificações foram marcadas como lidas');
      
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  // 🔔 NAVEGAR PARA CONTAGEM
  const navigateToCounting = (countingId?: string) => {
    if (countingId) {
      navigate('/countings');
      setShowNotifications(false);
    }
  };

  // 🔔 OBTER ÍCONE DA NOTIFICAÇÃO
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  // 🚨 FIXED: Enhanced company change with proper access validation
  const handleCompanyChange = async (companyId: string) => {
    try {
      console.log('🔄 COMPANY CHANGE REQUEST:', companyId);
      
      const selectedCompany = companies.find(c => c.id === companyId);
      if (!selectedCompany) {
        console.error('❌ Selected company not found in accessible companies');
        toast.error('Empresa não encontrada ou sem acesso');
        return;
      }

      // Double-check user access (security validation)
      if (authState.user?.email !== 'superadmin@cloudbpo.com') {
        const userAccessibleCompanyIds = authState.user?.accessibleCompanies || [authState.user?.companyId];
        
        if (!userAccessibleCompanyIds.includes(companyId)) {
          console.error('❌ SECURITY VIOLATION: User trying to access unauthorized company', {
            user: authState.user?.email,
            requestedCompany: companyId,
            accessibleCompanies: userAccessibleCompanyIds
          });
          toast.error('Acesso negado a esta empresa');
          return;
        }
      }

      console.log('✅ Access validated, changing company to:', selectedCompany.name);
      
      const success = await setCompany(selectedCompany);
      if (success) {
        toast.success(`Empresa alterada para: ${selectedCompany.name}`);
        // Refresh the page to reload data for the new company
        window.location.reload();
      } else {
        toast.error('Erro ao trocar empresa');
      }
    } catch (error) {
      console.error('❌ Error changing company:', error);
      toast.error('Erro interno ao trocar empresa');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Setores', href: '/sectors', icon: Building },
    { name: 'Contagens', href: '/countings', icon: ClipboardList },
    { name: 'MyBPO', href: '/mybpo', icon: MessageSquare },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Check if user is superadmin
  const isSuperAdmin = authState.user?.email === 'superadmin@cloudbpo.com';

  if (!authState.user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo - CloudBPO (Only text logo, larger size) */}
          <div className="flex items-center flex-shrink-0">
            <img 
              src={logoAzul} 
              alt="CloudBPO" 
              className="h-16 object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right side - Company Selector, Admin Menu (if superadmin), Notifications, User Menu */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* 🚨 FIXED: Company Selector with proper access control */}
            <div className="hidden md:block">
              <Select 
                value={authState.company?.id || ''} 
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger className="w-48 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
                  <SelectValue placeholder="Selecione uma empresa">
                    {authState.company && (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {authState.company.name}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* 🚨 CRITICAL FIX: Only show companies the user has access to */}
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{company.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {companies.length === 0 && (
                    <SelectItem value="no-access" disabled>
                      <span className="text-gray-500">Nenhuma empresa acessível</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Admin Panel Menu - Only for SuperAdmin */}
            {isSuperAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span className="hidden md:block">Painel Admin</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/companies')}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Empresas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/financial')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Financeiro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/users')}>
                    <Users className="mr-2 h-4 w-4" />
                    Usuários
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 🔔 NOTIFICAÇÕES FUNCIONAIS CORRIGIDAS */}
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold">Notificações</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                    <button
                      onClick={loadNotifications}
                      disabled={loadingNotifications}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      {loadingNotifications ? '⟳' : '↻'}
                    </button>
                  </div>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nenhuma notificação
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          navigateToCounting(notification.countingId);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="hidden md:block">{authState.user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{authState.user.name}</p>
                  <p className="text-xs text-gray-500">{authState.user.email}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {authState.user.role}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Mobile Company Selector */}
              <div className="mb-4">
                <Select 
                  value={authState.company?.id || ''} 
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <SelectValue placeholder="Selecione uma empresa">
                      {authState.company && (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium">{authState.company.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* 🚨 CRITICAL FIX: Mobile selector also filtered */}
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{company.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}

              {/* Mobile Admin Menu - Only for SuperAdmin */}
              {isSuperAdmin && (
                <div className="border-t pt-4 mt-4">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Painel Admin
                  </p>
                  <Link
                    to="/companies"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Empresas</span>
                    </div>
                  </Link>
                  <Link
                    to="/financial"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Financeiro</span>
                    </div>
                  </Link>
                  <Link
                    to="/users"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Usuários</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}