import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Search, Filter, Users, MapPin, Phone, Mail, Calendar, CreditCard } from 'lucide-react';
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

interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  type: string;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  updated_at: string;
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

const Companies: React.FC = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // 💳 PLAN LINKING MODAL STATE
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    type: 'cliente'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCompanies(),
        loadSubscriptionPlans()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      console.log('🔍 COMPANIES loadCompanies - STARTING');
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
          email: company.email || '',
          phone: company.phone || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          type: company.type || 'cliente',
          status: company.status || 'active',
          created_at: company.created_at,
          updated_at: company.updated_at || company.created_at
        }));
        console.log('🔍 COMPANIES loadCompanies - REAL DATA found:', mappedCompanies.length);
        setCompanies(mappedCompanies);
      } else {
        console.log('🔍 COMPANIES loadCompanies - NO DATA');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    }
  };

  // 🔧 FIXED: CREATE DEFAULT PLANS IF NONE EXIST
  const createDefaultPlans = async () => {
    try {
      console.log('🔧 Creating default subscription plans...');
      
      const defaultPlans = [
        {
          name: 'Básico',
          description: 'Plano ideal para pequenas empresas',
          price: 99.00,
          billing_cycle: 'monthly',
          features: ['Até 5 usuários', 'Suporte básico', 'Relatórios básicos', '10GB de armazenamento'],
          max_users: 5,
          max_products: 100
        },
        {
          name: 'Premium',
          description: 'Plano para empresas em crescimento',
          price: 199.00,
          billing_cycle: 'monthly',
          features: ['Até 25 usuários', 'Suporte prioritário', 'Relatórios avançados', '100GB de armazenamento', 'Integrações'],
          max_users: 25,
          max_products: 1000
        },
        {
          name: 'Empresarial',
          description: 'Plano completo para grandes empresas',
          price: 399.00,
          billing_cycle: 'monthly',
          features: ['Usuários ilimitados', 'Suporte 24/7', 'Relatórios personalizados', 'Armazenamento ilimitado', 'API completa'],
          max_users: -1,
          max_products: -1
        }
      ];

      const { error } = await supabase
        .from('app_0bcfd220f3_subscription_plans')
        .insert(defaultPlans);

      if (error) {
        console.error('Error creating default plans:', error);
      } else {
        console.log('✅ Default plans created successfully');
      }
    } catch (error) {
      console.error('Error creating default plans:', error);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      console.log('🔍 COMPANIES loadSubscriptionPlans - STARTING');
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
        console.log('🔍 COMPANIES loadSubscriptionPlans - REAL DATA found:', mappedPlans.length);
        setSubscriptionPlans(mappedPlans);
      } else {
        console.log('🔍 COMPANIES loadSubscriptionPlans - NO DATA - Creating default plans');
        // 🔧 CREATE DEFAULT PLANS IF NONE EXIST
        await createDefaultPlans();
        // Reload after creating default plans
        setTimeout(() => loadSubscriptionPlans(), 1000);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      setSubscriptionPlans([]);
    }
  };

  // 🚨 FIXED: COMPLETE REWRITE OF handleSubmit TO FIX SAVING ERROR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚨 COMPANIES handleSubmit - STARTING');
    console.log('🚨 Form data:', formData);
    console.log('🚨 Editing company:', editingCompany);
    
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      alert('Nome da empresa é obrigatório.');
      return;
    }
    
    if (!formData.cnpj || !formData.cnpj.trim()) {
      alert('CNPJ é obrigatório.');
      return;
    }
    
    try {
      const now = new Date().toISOString();
      
      // 🔧 FIXED: Prepare data with correct structure
      const companyData = {
        name: formData.name.trim(),
        cnpj: formData.cnpj.trim(),
        email: formData.email?.trim() || '',
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        state: formData.state?.trim() || '',
        type: formData.type || 'cliente',
        status: 'active',
        updated_at: now
      };

      console.log('🚨 Prepared company data:', companyData);

      if (editingCompany) {
        console.log('🚨 UPDATING existing company:', editingCompany.id);
        
        const { data, error } = await supabase
          .from(TABLES.COMPANIES)
          .update(companyData)
          .eq('id', editingCompany.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating company:', error);
          alert(`Erro ao atualizar empresa: ${error.message}`);
          return;
        }
        
        console.log('✅ Company updated successfully:', data);
      } else {
        console.log('🚨 CREATING new company');
        
        // 🔧 FIXED: Add created_at for new companies
        const newCompanyData = {
          ...companyData,
          created_at: now
        };
        
        console.log('🚨 New company data with created_at:', newCompanyData);

        const { data, error } = await supabase
          .from(TABLES.COMPANIES)
          .insert(newCompanyData)
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating company:', error);
          alert(`Erro ao criar empresa: ${error.message}`);
          return;
        }
        
        console.log('✅ Company created successfully:', data);
      }

      // Success - close dialog and reload
      setIsDialogOpen(false);
      resetForm();
      await loadCompanies(); // Reload companies list
      
      const successMessage = editingCompany ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!';
      alert(successMessage);
      
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      alert(`Erro ao salvar empresa: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      state: company.state,
      type: company.type
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (company: Company) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${company.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.COMPANIES)
        .delete()
        .eq('id', company.id);

      if (error) {
        console.error('Error deleting company:', error);
        alert('Erro ao excluir empresa.');
        return;
      }

      loadCompanies();
      alert('Empresa excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Erro ao excluir empresa.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      type: 'cliente'
    });
    setEditingCompany(null);
  };

  // 💳 PLAN LINKING FUNCTIONS - FIXED
  const openPlanModal = (company: Company) => {
    console.log('💳 Opening plan modal for company:', company.name);
    console.log('💳 Available plans:', subscriptionPlans);
    setSelectedCompany(company);
    setSelectedPlanId('');
    setIsPlanModalOpen(true);
  };

  const closePlanModal = () => {
    console.log('💳 Closing plan modal');
    setIsPlanModalOpen(false);
    setSelectedCompany(null);
    setSelectedPlanId('');
  };

  // 🔧 FIXED: COMPLETE PLAN LINKING WITH INVOICE GENERATION
  const handleLinkPlan = async () => {
    if (!selectedCompany || !selectedPlanId) {
      alert('Selecione um plano para continuar.');
      return;
    }

    try {
      const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        alert('Plano não encontrado!');
        return;
      }

      console.log('💳 LINKING PLAN:', selectedPlan.name, 'TO COMPANY:', selectedCompany.name);

      // 1. Create company subscription
      const subscriptionData = {
        company_id: selectedCompany.id,
        plan_id: selectedPlanId,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
      };

      console.log('💳 Creating subscription:', subscriptionData);

      const { data: newSubscription, error: subscriptionError } = await supabase
        .from('app_0bcfd220f3_company_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        console.error('❌ Error creating subscription:', subscriptionError);
        alert('Erro ao criar assinatura: ' + subscriptionError.message);
        return;
      }

      console.log('✅ Subscription created:', newSubscription);

      // 2. Generate 12 monthly invoices
      const invoices = [];
      const today = new Date();
      
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + i);
        dueDate.setDate(5); // Always due on the 5th of the month
        
        invoices.push({
          company_subscription_id: newSubscription.id,
          amount: selectedPlan.price,
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      }

      console.log('💳 Creating invoices:', invoices);

      const { error: invoicesError } = await supabase
        .from('app_0bcfd220f3_invoices')
        .insert(invoices);

      if (invoicesError) {
        console.error('❌ Error creating invoices:', invoicesError);
        alert('Assinatura criada, mas houve erro ao gerar faturas: ' + invoicesError.message);
      } else {
        console.log('✅ Generated', invoices.length, 'invoices successfully');
      }

      closePlanModal();
      
      // Show success message
      alert(`✅ SUCESSO!\n\nPlano "${selectedPlan.name}" vinculado à empresa "${selectedCompany.name}"!\n\n${invoices.length} faturas mensais foram geradas automaticamente.\n\nVá para "Financeiro" → "Contas a Receber" para ver as faturas.`);

    } catch (error) {
      console.error('❌ Error linking plan:', error);
      alert('Erro ao vincular plano: ' + error.message);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         company.cnpj.includes(searchText) ||
                         company.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    const matchesType = typeFilter === 'all' || company.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando empresas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
              <DialogDescription>
                {editingCompany ? 'Edite os dados da empresa' : 'Adicione uma nova empresa ao sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Empresa ABC Ltda"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="parceiro">Parceiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCompany ? 'Atualizar' : 'Criar'} Empresa
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CNPJ ou e-mail..."
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
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="fornecedor">Fornecedor</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                </div>
                <Badge variant={company.status === 'active' ? 'default' : company.status === 'blocked' ? 'destructive' : 'secondary'}>
                  {company.status === 'active' ? 'Ativo' : company.status === 'blocked' ? 'Bloqueado' : 'Inativo'}
                </Badge>
              </div>
              <CardDescription className="text-sm text-gray-600">
                {company.type.charAt(0).toUpperCase() + company.type.slice(1)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>CNPJ:</strong> {company.cnpj}
              </div>
              {company.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {company.email}
                </div>
              )}
              {company.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {company.phone}
                </div>
              )}
              {company.city && company.state && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {company.city}, {company.state}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                Criado em {new Date(company.created_at).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex justify-between items-center pt-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(company)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(company)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
                {/* 💳 PLAN LINKING BUTTON - FIXED */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openPlanModal(company)}
                  className="bg-blue-600 hover:bg-blue-700"
                  title="Vincular Plano de Assinatura"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  💳
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500 mb-2">
              Nenhuma empresa encontrada
            </p>
            <p className="text-sm text-gray-400">
              {companies.length === 0 
                ? 'Adicione sua primeira empresa clicando no botão "Nova Empresa"'
                : 'Ajuste os filtros ou termos de busca para encontrar empresas.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* 💳 PLAN LINKING MODAL - COMPLETELY FIXED */}
      {isPlanModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    💳 Vincular Plano de Assinatura
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Empresa: <strong>{selectedCompany.name}</strong>
                  </p>
                </div>
                <button
                  onClick={closePlanModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Selecione um Plano *
                  </Label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um plano...</option>
                    {subscriptionPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                      </option>
                    ))}
                  </select>
                  {subscriptionPlans.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Carregando planos...
                    </p>
                  )}
                </div>

                {selectedPlanId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {(() => {
                      const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId);
                      return selectedPlan ? (
                        <div>
                          <h3 className="font-medium text-blue-900">{selectedPlan.name}</h3>
                          <p className="text-sm text-blue-700 mt-1">{selectedPlan.description}</p>
                          <p className="text-lg font-bold text-blue-900 mt-2">
                            R$ {selectedPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {selectedPlan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                          </p>
                          <ul className="text-sm text-blue-700 mt-2 space-y-1">
                            {selectedPlan.features.map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Atenção:</strong> Ao vincular este plano, serão geradas automaticamente 12 faturas mensais com vencimento no dia 5 de cada mês. As faturas aparecerão na aba "Contas a Receber" do módulo Financeiro.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={closePlanModal}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleLinkPlan}
                  disabled={!selectedPlanId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  💳 Vincular Plano
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;