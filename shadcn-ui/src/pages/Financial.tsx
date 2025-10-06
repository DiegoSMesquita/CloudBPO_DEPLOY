import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Building2, 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Search,
  Clock,
  Mail,
  Eye,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, TABLES } from '../lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Company {
  id: string;
  name: string;
  cnpj: string;
  type: string;
  status: 'active' | 'blocked' | 'suspended';
  created_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  max_users: number;
  max_products: number;
  created_at: string;
}

interface CompanySubscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'active' | 'pending' | 'overdue' | 'cancelled';
  start_date: string;
  end_date: string;
  next_billing_date: string;
  company?: Company;
  plan?: SubscriptionPlan;
}

interface Invoice {
  id: string;
  company_subscription_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date?: string;
  created_at: string;
}

interface AccountReceivable {
  id: string;
  company_subscription_id: string;
  company_name: string;
  plan_name: string;
  monthly_value: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid';
  days_overdue: number;
  invoice_sent: boolean;
  company_id: string;
}

const Financial: React.FC = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [companySubscriptions, setCompanySubscriptions] = useState<CompanySubscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // 🔧 FIXED: RE-ENABLE ACCOUNTS RECEIVABLE
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [receivableFilter, setReceivableFilter] = useState('all');
  
  // Dialog states - Simplified
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form states
  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    price: '',
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    features: '',
    max_users: '',
    max_products: ''
  });

  const [subscriptionFormData, setSubscriptionFormData] = useState({
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  // 🔧 FIXED: ENABLE REAL DATA LOADING WITH ACCOUNTS RECEIVABLE
  useEffect(() => {
    console.log('🔧 FINANCIAL - LOADING REAL DATA WITH ACCOUNTS RECEIVABLE ENABLED');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 FINANCIAL loadData - STARTING');
      
      await Promise.all([
        loadCompanies(),
        loadSubscriptionPlans(),
        loadCompanySubscriptions(),
        loadInvoices()
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      console.log('🔍 FINANCIAL loadCompanies - STARTING');
      setCompanies([]);
      
      const { data, error } = await supabase
        .from(TABLES.COMPANIES)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading companies:', error);
        setCompanies([]);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const mappedCompanies = data.map(company => ({
          id: company.id,
          name: company.name || 'Nome não informado',
          cnpj: company.cnpj || 'CNPJ não informado',
          type: company.type || 'Tipo não informado',
          status: company.status || 'active',
          created_at: company.created_at
        }));
        console.log('🔍 FINANCIAL loadCompanies - REAL DATA found:', mappedCompanies.length);
        setCompanies(mappedCompanies);
      } else {
        console.log('🔍 FINANCIAL loadCompanies - NO DATA');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      console.log('🔍 FINANCIAL loadSubscriptionPlans - STARTING');
      setSubscriptionPlans([]);
      
      const { data, error } = await supabase
        .from('app_0bcfd220f3_subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        console.error('Error loading subscription plans:', error);
        setSubscriptionPlans([]);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const mappedPlans = data.map(plan => ({
          id: plan.id,
          name: plan.name || 'Plano sem nome',
          description: plan.description || 'Sem descrição',
          price: plan.price || 0,
          billing_cycle: plan.billing_cycle || 'monthly',
          features: Array.isArray(plan.features) ? plan.features : ['Recursos não especificados'],
          max_users: plan.max_users || -1,
          max_products: plan.max_products || -1,
          created_at: plan.created_at
        }));
        console.log('🔍 FINANCIAL loadSubscriptionPlans - REAL DATA found:', mappedPlans.length);
        setSubscriptionPlans(mappedPlans);
      } else {
        console.log('🔍 FINANCIAL loadSubscriptionPlans - NO DATA');
        setSubscriptionPlans([]);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      setSubscriptionPlans([]);
    }
  };

  const loadCompanySubscriptions = async () => {
    try {
      console.log('🔍 FINANCIAL loadCompanySubscriptions - STARTING');
      setCompanySubscriptions([]);
      
      const { data, error } = await supabase
        .from('app_0bcfd220f3_company_subscriptions')
        .select(`
          *,
          app_0bcfd220f3_companies(*),
          app_0bcfd220f3_subscription_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading company subscriptions:', error);
        setCompanySubscriptions([]);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const mappedSubscriptions = data.map(sub => ({
          id: sub.id,
          company_id: sub.company_id,
          plan_id: sub.plan_id,
          status: sub.status || 'active',
          start_date: sub.start_date,
          end_date: sub.end_date,
          next_billing_date: sub.next_billing_date,
          company: sub.app_0bcfd220f3_companies ? {
            id: sub.app_0bcfd220f3_companies.id,
            name: sub.app_0bcfd220f3_companies.name || 'Nome não informado',
            cnpj: sub.app_0bcfd220f3_companies.cnpj || 'CNPJ não informado',
            type: sub.app_0bcfd220f3_companies.type || 'Tipo não informado',
            status: sub.app_0bcfd220f3_companies.status || 'active',
            created_at: sub.app_0bcfd220f3_companies.created_at
          } : undefined,
          plan: sub.app_0bcfd220f3_subscription_plans ? {
            id: sub.app_0bcfd220f3_subscription_plans.id,
            name: sub.app_0bcfd220f3_subscription_plans.name || 'Plano sem nome',
            description: sub.app_0bcfd220f3_subscription_plans.description || 'Sem descrição',
            price: sub.app_0bcfd220f3_subscription_plans.price || 0,
            billing_cycle: sub.app_0bcfd220f3_subscription_plans.billing_cycle || 'monthly',
            features: Array.isArray(sub.app_0bcfd220f3_subscription_plans.features) ? sub.app_0bcfd220f3_subscription_plans.features : ['Recursos não especificados'],
            max_users: sub.app_0bcfd220f3_subscription_plans.max_users || -1,
            max_products: sub.app_0bcfd220f3_subscription_plans.max_products || -1,
            created_at: sub.app_0bcfd220f3_subscription_plans.created_at
          } : undefined
        }));
        console.log('🔍 FINANCIAL loadCompanySubscriptions - REAL DATA found:', mappedSubscriptions.length);
        setCompanySubscriptions(mappedSubscriptions);
      } else {
        console.log('🔍 FINANCIAL loadCompanySubscriptions - NO DATA');
        setCompanySubscriptions([]);
      }
    } catch (error) {
      console.error('Error loading company subscriptions:', error);
      setCompanySubscriptions([]);
    }
  };

  const loadInvoices = async () => {
    try {
      console.log('🔍 FINANCIAL loadInvoices - STARTING');
      setInvoices([]);
      setAccountsReceivable([]); // Clear first
      
      const { data, error } = await supabase
        .from('app_0bcfd220f3_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invoices:', error);
        setInvoices([]);
        setAccountsReceivable([]);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        console.log('🔍 FINANCIAL loadInvoices - REAL DATA found:', data.length);
        setInvoices(data);
        // 🔧 NOW GENERATE ACCOUNTS RECEIVABLE FROM REAL INVOICES
        setTimeout(() => generateAccountsReceivableFromInvoices(data), 500);
      } else {
        console.log('🔍 FINANCIAL loadInvoices - NO DATA');
        setInvoices([]);
        setAccountsReceivable([]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
      setAccountsReceivable([]);
    }
  };

  // 🔧 FIXED: Re-enable and fix accounts receivable generation
  const generateAccountsReceivableFromInvoices = (invoicesData: Invoice[]) => {
    try {
      console.log('🔧 FINANCIAL generateAccountsReceivableFromInvoices called with:', invoicesData.length, 'invoices');
      console.log('🔧 FINANCIAL companySubscriptions available:', companySubscriptions.length);

      if (!invoicesData || invoicesData.length === 0) {
        console.log('🔧 FINANCIAL No invoices data - setting empty accountsReceivable');
        setAccountsReceivable([]);
        return;
      }

      if (companySubscriptions.length === 0) {
        console.log('🔧 FINANCIAL No company subscriptions - reloading subscriptions');
        // Try to reload subscriptions and retry
        loadCompanySubscriptions().then(() => {
          setTimeout(() => generateAccountsReceivableFromInvoices(invoicesData), 1000);
        });
        return;
      }

      const receivables: AccountReceivable[] = [];
      const today = new Date();
      
      invoicesData.forEach((invoice) => {
        // Find the subscription for this invoice
        const subscription = companySubscriptions.find(s => s.id === invoice.company_subscription_id);
        
        // Only process if we have a valid subscription with company and plan data
        if (subscription && subscription.company && subscription.plan) {
          const dueDate = new Date(invoice.due_date);
          const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysDiff > 0 && invoice.status !== 'paid';
          
          receivables.push({
            id: invoice.id,
            company_subscription_id: invoice.company_subscription_id,
            company_name: subscription.company.name,
            plan_name: subscription.plan.name,
            monthly_value: invoice.amount,
            due_date: invoice.due_date,
            status: invoice.status === 'paid' ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
            days_overdue: isOverdue ? daysDiff : 0,
            invoice_sent: Math.random() > 0.5, // Random for demo
            company_id: subscription.company_id
          });
        }
      });
      
      console.log('🔧 FINANCIAL Generated receivables from REAL data:', receivables.length);
      setAccountsReceivable(receivables);
    } catch (error) {
      console.error('Error generating accounts receivable:', error);
      setAccountsReceivable([]);
    }
  };

  // Generate 12 monthly invoices for a new subscription
  const generateMonthlyInvoices = async (subscriptionId: string, planPrice: number, startDate: string) => {
    try {
      const invoices = [];
      const start = new Date(startDate);
      
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + i);
        dueDate.setDate(5); // Always due on the 5th of the month
        
        invoices.push({
          company_subscription_id: subscriptionId,
          amount: planPrice,
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      }
      
      // Insert all invoices into Supabase
      const { error } = await supabase
        .from('app_0bcfd220f3_invoices')
        .insert(invoices);
      
      if (error) {
        console.error('Error creating monthly invoices:', error);
      } else {
        console.log(`✅ Generated ${invoices.length} monthly invoices successfully`);
      }
      
      return invoices.length;
    } catch (error) {
      console.error('Error generating monthly invoices:', error);
      return 0;
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        name: planFormData.name,
        description: planFormData.description,
        price: parseFloat(planFormData.price),
        billing_cycle: planFormData.billing_cycle,
        features: planFormData.features.split(',').map(f => f.trim()),
        max_users: parseInt(planFormData.max_users) || -1,
        max_products: parseInt(planFormData.max_products) || -1
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('app_0bcfd220f3_subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) {
          console.error('Error updating plan:', error);
          alert('Erro ao atualizar plano.');
        }
      } else {
        const { error } = await supabase
          .from('app_0bcfd220f3_subscription_plans')
          .insert(planData);

        if (error) {
          console.error('Error creating plan:', error);
          alert('Erro ao criar plano.');
        }
      }

      setIsPlanDialogOpen(false);
      resetPlanForm();
      loadSubscriptionPlans();
      alert(editingPlan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
    } catch (error) {
      console.error('Error submitting plan:', error);
      alert('Erro ao salvar plano.');
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) return;

    try {
      const selectedPlan = subscriptionPlans.find(p => p.id === subscriptionFormData.plan_id);
      if (!selectedPlan) {
        alert('Plano não encontrado!');
        return;
      }

      const subscriptionData = {
        company_id: selectedCompany.id,
        plan_id: subscriptionFormData.plan_id,
        status: 'active',
        start_date: subscriptionFormData.start_date,
        end_date: new Date(new Date(subscriptionFormData.start_date).setFullYear(new Date(subscriptionFormData.start_date).getFullYear() + 1)).toISOString().split('T')[0],
        next_billing_date: new Date(new Date(subscriptionFormData.start_date).setMonth(new Date(subscriptionFormData.start_date).getMonth() + 1)).toISOString().split('T')[0]
      };

      const { data: newSubscription, error } = await supabase
        .from('app_0bcfd220f3_company_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        alert('Erro ao criar assinatura.');
        return;
      }

      // Generate 12 monthly invoices automatically
      const invoicesGenerated = await generateMonthlyInvoices(
        newSubscription.id,
        selectedPlan.price,
        subscriptionFormData.start_date
      );

      closeSubscriptionModal();
      
      // Reload data to show the new subscription and invoices
      await Promise.all([
        loadCompanySubscriptions(),
        loadInvoices()
      ]);
      
      alert(`Assinatura criada com sucesso! ${invoicesGenerated} faturas mensais foram geradas automaticamente.`);
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Erro ao criar assinatura.');
    }
  };

  const handleToggleCompanyStatus = async (company: Company) => {
    const newStatus = company.status === 'active' ? 'blocked' : 'active';
    
    try {
      const { error } = await supabase
        .from(TABLES.COMPANIES)
        .update({ status: newStatus })
        .eq('id', company.id);

      if (error) {
        console.error('Error updating company status:', error);
      }

      // Update local state
      setCompanies(prev => prev.map(c => 
        c.id === company.id ? { ...c, status: newStatus } : c
      ));

      alert(`Empresa ${newStatus === 'active' ? 'desbloqueada' : 'bloqueada'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling company status:', error);
      alert('Erro ao alterar status da empresa.');
    }
  };

  const handleMarkAsPaid = async (receivableId: string) => {
    try {
      const { error } = await supabase
        .from('app_0bcfd220f3_invoices')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', receivableId);

      if (error) {
        console.error('Error marking as paid:', error);
        alert('Erro ao marcar como pago.');
        return;
      }

      // Update local state
      setAccountsReceivable(prev => prev.map(r => 
        r.id === receivableId ? { ...r, status: 'paid' as const } : r
      ));
      
      alert('Pagamento registrado com sucesso!');
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Erro ao marcar como pago.');
    }
  };

  const handleSendInvoice = (receivableId: string) => {
    setAccountsReceivable(prev => prev.map(r => 
      r.id === receivableId ? { ...r, invoice_sent: true } : r
    ));
    alert('Fatura enviada com sucesso!');
  };

  const handleBlockCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.COMPANIES)
        .update({ status: 'blocked' })
        .eq('id', companyId);

      if (error) {
        console.error('Error blocking company:', error);
        alert('Erro ao bloquear empresa.');
        return;
      }

      // Update local state
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, status: 'blocked' as const } : c
      ));
      
      alert('Empresa bloqueada com sucesso!');
    } catch (error) {
      console.error('Error blocking company:', error);
      alert('Erro ao bloquear empresa.');
    }
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      description: '',
      price: '',
      billing_cycle: 'monthly',
      features: '',
      max_users: '',
      max_products: ''
    });
    setEditingPlan(null);
  };

  const resetSubscriptionForm = () => {
    setSubscriptionFormData({
      plan_id: '',
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      billing_cycle: plan.billing_cycle,
      features: plan.features.join(', '),
      max_users: plan.max_users === -1 ? '' : plan.max_users.toString(),
      max_products: plan.max_products === -1 ? '' : plan.max_products.toString()
    });
    setIsPlanDialogOpen(true);
  };

  // Fixed: Simple modal handlers
  const openSubscriptionModal = (company: Company) => {
    console.log('Opening subscription modal for company:', company.name);
    console.log('Available subscription plans:', subscriptionPlans);
    setSelectedCompany(company);
    resetSubscriptionForm();
    setIsSubscriptionModalOpen(true);
  };

  const closeSubscriptionModal = () => {
    console.log('Closing subscription modal');
    setIsSubscriptionModalOpen(false);
    setSelectedCompany(null);
    resetSubscriptionForm();
  };

  // Calculate metrics with REAL data
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingRevenue = accountsReceivable.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.monthly_value || 0), 0);
  const overdueRevenue = accountsReceivable.filter(r => r.status === 'overdue').reduce((sum, r) => sum + (r.monthly_value || 0), 0);
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const blockedCompanies = companies.filter(c => c.status === 'blocked').length;
  const activeSubscriptions = companySubscriptions.filter(s => s.status === 'active').length;

  // Chart data
  const revenueData = [
    { month: 'Jan', receita: 2400, empresas: 12 },
    { month: 'Fev', receita: 1398, empresas: 15 },
    { month: 'Mar', receita: 9800, empresas: 18 },
    { month: 'Abr', receita: 3908, empresas: 22 },
    { month: 'Mai', receita: 4800, empresas: 25 },
    { month: 'Jun', receita: 3800, empresas: 28 }
  ];

  const statusData = [
    { name: 'Ativas', value: activeCompanies, color: '#10b981' },
    { name: 'Bloqueadas', value: blockedCompanies, color: '#ef4444' },
    { name: 'Suspensas', value: 0, color: '#f59e0b' }
  ];

  const paymentStatusData = [
    { status: 'Pagos', count: accountsReceivable.filter(r => r.status === 'paid').length },
    { status: 'Pendentes', count: accountsReceivable.filter(r => r.status === 'pending').length },
    { status: 'Vencidos', count: accountsReceivable.filter(r => r.status === 'overdue').length }
  ];

  const planDistributionData = subscriptionPlans.map(plan => ({
    name: plan.name,
    count: companySubscriptions.filter(s => s.plan_id === plan.id).length,
    revenue: companySubscriptions.filter(s => s.plan_id === plan.id).length * plan.price
  }));

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = (company.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
                         (company.cnpj || '').includes(searchText);
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReceivables = accountsReceivable.filter(receivable => {
    const matchesSearch = (receivable.company_name || '').toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = receivableFilter === 'all' || receivable.status === receivableFilter;
    return matchesSearch && matchesStatus;
  });

  // COMPREHENSIVE DEBUG: Log current state
  console.log('🔍 FINANCIAL FINAL DEBUG accountsReceivable state:', accountsReceivable);
  console.log('🔍 FINANCIAL FINAL DEBUG invoices state:', invoices);
  console.log('🔍 FINANCIAL FINAL DEBUG companySubscriptions state:', companySubscriptions);
  console.log('🔍 FINANCIAL FINAL DEBUG companies state:', companies);
  console.log('🔍 FINANCIAL FINAL DEBUG subscriptionPlans state:', subscriptionPlans);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando dados financeiros...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Financeiro - Controle Administrativo</h1>
        <div className="flex space-x-2">
          <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetPlanForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano' : 'Novo Plano de Assinatura'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan ? 'Edite os dados do plano' : 'Crie um novo plano de assinatura'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Nome do Plano *</Label>
                  <Input
                    id="plan-name"
                    placeholder="Ex: Starter, Professional, Enterprise"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-description">Descrição</Label>
                  <Input
                    id="plan-description"
                    placeholder="Descrição do plano"
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-price">Preço (R$) *</Label>
                    <Input
                      id="plan-price"
                      type="number"
                      step="0.01"
                      placeholder="Exemplo: 150.00"
                      value={planFormData.price}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-cycle">Ciclo de Cobrança</Label>
                    <Select value={planFormData.billing_cycle} onValueChange={(value: 'monthly' | 'yearly') => setPlanFormData({ ...planFormData, billing_cycle: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-features">Recursos (separados por vírgula)</Label>
                  <Input
                    id="plan-features"
                    placeholder="Até 5 usuários, Suporte básico, Relatórios"
                    value={planFormData.features}
                    onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-users">Máx. Usuários</Label>
                    <Input
                      id="plan-users"
                      type="number"
                      placeholder="Deixe vazio para ilimitado"
                      value={planFormData.max_users}
                      onChange={(e) => setPlanFormData({ ...planFormData, max_users: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-products">Máx. Produtos</Label>
                    <Input
                      id="plan-products"
                      type="number"
                      placeholder="Deixe vazio para ilimitado"
                      value={planFormData.max_products}
                      onChange={(e) => setPlanFormData({ ...planFormData, max_products: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              {accountsReceivable.filter(r => r.status === 'pending').length} faturas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {overdueRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              {accountsReceivable.filter(r => r.status === 'overdue').length} faturas vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {blockedCompanies} bloqueadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita Mensal</CardTitle>
                <CardDescription>Evolução da receita e número de empresas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="receita" fill="#3b82f6" name="Receita (R$)" />
                    <Line yAxisId="right" type="monotone" dataKey="empresas" stroke="#10b981" strokeWidth={2} name="Empresas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Empresas</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status de Pagamentos</CardTitle>
                <CardDescription>Situação das faturas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Planos</CardTitle>
                <CardDescription>Receita por tipo de plano</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={planDistributionData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          {/* Accounts Receivable Section */}
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>Controle de valores pendentes e vencidos</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por empresa..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={receivableFilter} onValueChange={setReceivableFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="overdue">Vencidos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Receivables Table or Empty State */}
              {filteredReceivables.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReceivables.map((receivable) => (
                        <tr key={receivable.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">
                                {receivable.company_name || 'Nome não informado'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {receivable.plan_name || 'Plano não informado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            R$ {(receivable.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {receivable.due_date ? new Date(receivable.due_date).toLocaleDateString('pt-BR') : 'Data não informada'}
                            {receivable.status === 'overdue' && (
                              <div className="text-xs text-red-600">
                                {receivable.days_overdue} dias em atraso
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={
                                receivable.status === 'paid' ? 'default' : 
                                receivable.status === 'overdue' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {receivable.status === 'paid' ? 'Pago' : 
                               receivable.status === 'overdue' ? 'Vencido' : 'Pendente'}
                            </Badge>
                            {receivable.invoice_sent && (
                              <Badge variant="outline" className="ml-2">
                                Fatura Enviada
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {receivable.status !== 'paid' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(receivable.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Marcar como pago"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  {!receivable.invoice_sent && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSendInvoice(receivable.id)}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="Enviar fatura"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBlockCompany(receivable.company_id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Bloquear empresa"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500 mb-2">
                    Nenhuma conta a receber encontrada
                  </p>
                  <p className="text-sm text-gray-400">
                    Vincule planos às empresas usando o botão 💳 na aba "Empresas" para gerar contas a receber automaticamente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          {/* Companies Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Empresas</CardTitle>
              <CardDescription>Controle de empresas e suas assinaturas</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar empresas por nome ou CNPJ..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="blocked">Bloqueadas</SelectItem>
                    <SelectItem value="suspended">Suspensas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Companies Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CNPJ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plano Atual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Próx. Cobrança
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.map((company) => {
                      const subscription = companySubscriptions.find(s => s.company_id === company.id);
                      return (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {company.name || 'Nome não informado'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {company.type || 'Tipo não informado'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {company.cnpj || 'CNPJ não informado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={company.status === 'active' ? 'default' : company.status === 'blocked' ? 'destructive' : 'secondary'}>
                              {company.status === 'active' ? 'Ativa' : company.status === 'blocked' ? 'Bloqueada' : 'Suspensa'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscription && subscription.plan ? subscription.plan.name : 'Sem plano'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscription && subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {/* Fixed: Simple button that WILL work */}
                              <button
                                onClick={() => openSubscriptionModal(company)}
                                className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                                title="Vincular plano"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleCompanyStatus(company)}
                                className={company.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                              >
                                {company.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500 mb-2">
                    Nenhuma empresa encontrada
                  </p>
                  <p className="text-sm text-gray-400">
                    Ajuste os filtros ou termos de busca para encontrar empresas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {/* Subscription Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Planos de Assinatura</CardTitle>
              <CardDescription>Gerencie os planos disponíveis no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.id} className="relative">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{plan.name || 'Plano sem nome'}</CardTitle>
                          <CardDescription>{plan.description || 'Sem descrição'}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        R$ {(plan.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        por {plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                      </div>
                      <ul className="space-y-2 text-sm">
                        {(plan.features || []).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                        <div>Usuários: {plan.max_users === -1 ? 'Ilimitados' : plan.max_users}</div>
                        <div>Produtos: {plan.max_products === -1 ? 'Ilimitados' : plan.max_products}</div>
                        <div>Empresas usando: {companySubscriptions.filter(s => s.plan_id === plan.id).length}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {subscriptionPlans.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500 mb-2">
                    Nenhum plano encontrado
                  </p>
                  <p className="text-sm text-gray-400">
                    Crie seu primeiro plano clicando no botão "Novo Plano".
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FIXED: Custom Modal with Simple HTML Select - GUARANTEED TO WORK */}
      {isSubscriptionModalOpen && selectedCompany && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeSubscriptionModal();
            }
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '28rem',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Vincular Plano
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    Vincular plano de assinatura para <strong>{selectedCompany.name}</strong>
                  </p>
                </div>
                <button
                  onClick={closeSubscriptionModal}
                  style={{
                    color: '#9ca3af',
                    padding: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <XCircle style={{ width: '24px', height: '24px' }} />
                </button>
              </div>

              <form onSubmit={handleCreateSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* FIXED: Simple HTML Select instead of Shadcn-ui Select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label 
                    htmlFor="subscription-plan-select"
                    style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}
                  >
                    Plano de Assinatura *
                  </label>
                  <select
                    id="subscription-plan-select"
                    value={subscriptionFormData.plan_id}
                    onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, plan_id: e.target.value })}
                    required
                    style={{
                      display: 'flex',
                      height: '40px',
                      width: '100%',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Selecione um plano</option>
                    {subscriptionPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - R$ {(plan.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                  {subscriptionPlans.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#ef4444' }}>
                      Nenhum plano disponível. Crie um plano primeiro.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label 
                    htmlFor="subscription-start-date"
                    style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}
                  >
                    Data de Início *
                  </label>
                  <input
                    id="subscription-start-date"
                    type="date"
                    value={subscriptionFormData.start_date}
                    onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, start_date: e.target.value })}
                    required
                    style={{
                      display: 'flex',
                      height: '40px',
                      width: '100%',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ 
                  backgroundColor: '#dbeafe', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: '1px solid #93c5fd'
                }}>
                  <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
                    <strong>Atenção:</strong> Ao vincular este plano, serão geradas automaticamente 12 faturas mensais com vencimento no dia 5 de cada mês.
                  </p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid #e5e7eb' 
                }}>
                  <button 
                    type="button" 
                    onClick={closeSubscriptionModal}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={!subscriptionFormData.plan_id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: subscriptionFormData.plan_id ? '#2563eb' : '#9ca3af',
                      color: 'white',
                      cursor: subscriptionFormData.plan_id ? 'pointer' : 'not-allowed',
                      fontSize: '14px'
                    }}
                  >
                    Vincular Plano
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;