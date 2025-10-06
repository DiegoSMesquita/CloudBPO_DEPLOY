import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Users, 
  Building2, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/database';
import { Product, Counting, Task, Message } from '@/lib/types';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCountings: 0,
    pendingTasks: 0,
    unreadMessages: 0
  });
  const [recentCountings, setRecentCountings] = useState<Counting[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (authState.company) {
      loadDashboardData();
    }
  }, [authState.company]);

  const loadDashboardData = async () => {
    if (!authState.company || !authState.user) return;
    
    try {
      setLoading(true);
      
      // Load basic statistics
      const [products, countings, tasks, messages] = await Promise.all([
        db.getProductsAsync(authState.company.id).catch(() => []),
        db.getCountingsAsync(authState.company.id).catch(() => []),
        db.getTasksAsync(authState.company.id).catch(() => []),
        db.getMessagesAsync(authState.company.id).catch(() => [])
      ]);

      // Calculate stats
      const pendingTasks = tasks.filter(task => 
        task.status === 'pending' || task.status === 'in_progress'
      ).length;

      const unreadMessages = messages.filter(msg => 
        !msg.read && (msg.userId === authState.user?.id || !msg.userId)
      ).length;

      setStats({
        totalProducts: products.length,
        totalCountings: countings.length,
        pendingTasks,
        unreadMessages
      });

      // Set recent data
      setRecentCountings(countings.slice(0, 5));
      setRecentTasks(tasks.slice(0, 5));

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getCountingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <LayoutDashboard className="h-8 w-8 mr-3 text-blue-600" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo, {authState.user?.name} - {authState.company?.name}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/countings')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contagens</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCountings}</div>
            <p className="text-xs text-muted-foreground">
              Contagens realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/mybpo')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/mybpo')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Countings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contagens Recentes</CardTitle>
                <CardDescription>Últimas contagens realizadas</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/countings')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Contagem
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCountings.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Nenhuma contagem encontrada</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/countings')}
                  >
                    Criar primeira contagem
                  </Button>
                </div>
              ) : (
                recentCountings.map((counting) => (
                  <div key={counting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{counting.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(counting.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <Badge className={getCountingStatusColor(counting.status)}>
                      {counting.status === 'completed' ? 'Concluída' : 
                       counting.status === 'in_progress' ? 'Em Andamento' : 'Rascunho'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tarefas Recentes</CardTitle>
                <CardDescription>Suas tarefas mais recentes</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/mybpo')}>
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Nenhuma tarefa encontrada</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/mybpo')}
                  >
                    Ver Meu BPO
                  </Button>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500">
                        {task.dueDate ? `Prazo: ${new Date(task.dueDate).toLocaleDateString('pt-BR')}` : 'Sem prazo'}
                      </div>
                    </div>
                    <Badge className={getTaskPriorityColor(task.priority)}>
                      {task.priority === 'urgent' ? 'Urgente' :
                       task.priority === 'high' ? 'Alta' :
                       task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/products')}>
              <Package className="h-6 w-6 mb-2" />
              <span>Produtos</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/sectors')}>
              <Building2 className="h-6 w-6 mb-2" />
              <span>Setores</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/countings')}>
              <ClipboardList className="h-6 w-6 mb-2" />
              <span>Contagens</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/mybpo')}>
              <MessageSquare className="h-6 w-6 mb-2" />
              <span>Meu BPO</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}