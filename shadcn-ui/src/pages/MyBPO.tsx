import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Send, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  Bell,
  Filter,
  Trash2,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { Message } from '@/lib/types';
import { toast } from 'sonner';

export default function MyBPOPage() {
  const { authState } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  useEffect(() => {
    if (authState.company) {
      loadMessages();
    }
  }, [authState.company]);

  const loadMessages = async () => {
    if (!authState.company) return;
    
    try {
      setLoading(true);
      const loadedMessages = await db.getMessagesAsync(authState.company.id);
      setMessages(loadedMessages);
      console.log('✅ Messages loaded:', loadedMessages.length);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = async () => {
    if (!authState.company || !authState.user) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }

    try {
      const newMessage: Message = {
        id: `message-${Date.now()}`,
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        companyId: authState.company.id,
        userId: authState.user.id,
        senderName: authState.user.name,
        senderRole: authState.user.role,
        read: false,
        createdAt: new Date().toISOString()
      };

      await db.saveMessageAsync(newMessage);
      await loadMessages();
      
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Comunicado criado com sucesso!');
    } catch (error) {
      console.error('❌ Error creating message:', error);
      toast.error('Erro ao criar comunicado');
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!authState.company) return;

    if (confirm(`Tem certeza que deseja excluir o comunicado "${message.title}"?`)) {
      try {
        await db.deleteMessageAsync(message.id, authState.company.id);
        await loadMessages();
        toast.success('Comunicado excluído com sucesso!');
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        toast.error('Erro ao excluir comunicado');
      }
    }
  };

  const handleMarkAsRead = async (message: Message) => {
    if (message.read) return;

    try {
      const updatedMessage = { ...message, read: true, readAt: new Date().toISOString() };
      await db.saveMessageAsync(updatedMessage);
      await loadMessages();
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 'medium'
    });
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800'
    };

    const labels = {
      info: 'Informação',
      warning: 'Aviso',
      error: 'Erro',
      success: 'Sucesso'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || colors.info}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };

    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.senderName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Separate internal communications from client messages
  const internalMessages = filteredMessages.filter(msg => 
    msg.senderRole && ['admin', 'manager', 'employee'].includes(msg.senderRole)
  );
  
  const clientMessages = filteredMessages.filter(msg => 
    !msg.senderRole || msg.senderRole === 'client'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando comunicados...</p>
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
            <MessageSquare className="h-8 w-8 mr-3 text-blue-600" />
            Meu BPO
          </h1>
          <p className="text-muted-foreground">
            Comunicados internos e mensagens do cliente
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Comunicado</DialogTitle>
              <DialogDescription>
                Envie um comunicado interno para a equipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do comunicado"
                />
              </div>
              <div>
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Conteúdo da mensagem"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value: 'info' | 'warning' | 'error' | 'success') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Informação</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMessage}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Comunicado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar comunicados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="info">Informação</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Internal Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Comunicados Internos ({internalMessages.length})
          </CardTitle>
          <CardDescription>
            Comunicações da equipe e administração
          </CardDescription>
        </CardHeader>
        <CardContent>
          {internalMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum comunicado interno encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {internalMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !message.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMarkAsRead(message)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{message.title}</h3>
                      {!message.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(message.type)}
                      {getPriorityBadge(message.priority)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(message);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {authState.user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(message);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{message.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{message.senderName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(message.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Mensagens do Cliente ({clientMessages.length})
          </CardTitle>
          <CardDescription>
            Mensagens enviadas pelo cliente ao BPO
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma mensagem do cliente encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !message.read ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMarkAsRead(message)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{message.title}</h3>
                      {!message.read && <div className="w-2 h-2 bg-green-600 rounded-full" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Cliente</Badge>
                      {getPriorityBadge(message.priority)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(message);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{message.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{message.senderName || 'Cliente'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(message.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage?.title}
              {selectedMessage && getTypeBadge(selectedMessage.type)}
              {selectedMessage && getPriorityBadge(selectedMessage.priority)}
            </DialogTitle>
            <DialogDescription>
              Por {selectedMessage?.senderName} em {selectedMessage && new Date(selectedMessage.createdAt).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="whitespace-pre-wrap text-gray-700">
              {selectedMessage?.content}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}