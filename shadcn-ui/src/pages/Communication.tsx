import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { Message, MessageAttachment, User, PRIORITY_TYPES } from '@/lib/types';
import { 
  Plus, 
  MessageSquare, 
  Send, 
  Paperclip, 
  Download, 
  Trash2, 
  Eye,
  Users,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function CommunicationPage() {
  const { authState } = useAuth();
  const companyId = authState.company?.id || '';
  const currentUserId = authState.user?.id || '';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    receiverId: '',
    subject: '',
    content: '',
    priority: 'medium' as keyof typeof PRIORITY_TYPES
  });
  
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

  useEffect(() => {
    loadData();
  }, [companyId, currentUserId]);

  const loadData = () => {
    const allMessages = db.getMessages(companyId);
    const companyUsers = db.getUsers().filter(u => u.companyId === companyId);
    
    setMessages(allMessages);
    setUsers(companyUsers);
    
    // Separate sent and received messages
    const sent = allMessages.filter(m => m.senderId === currentUserId);
    const received = allMessages.filter(m => 
      m.receiverId === currentUserId || (!m.receiverId && m.senderId !== currentUserId)
    );
    
    setSentMessages(sent);
    setReceivedMessages(received);
  };

  const resetForm = () => {
    setFormData({
      receiverId: '',
      subject: '',
      content: '',
      priority: 'medium'
    });
    setAttachments([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: MessageAttachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          url: e.target?.result as string
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.content.trim()) {
      toast.error('Assunto e mensagem são obrigatórios');
      return;
    }

    const receiver = users.find(u => u.id === formData.receiverId);
    
    const message: Message = {
      id: Date.now().toString(),
      companyId,
      senderId: currentUserId,
      senderName: authState.user?.name || '',
      receiverId: formData.receiverId || undefined,
      receiverName: receiver?.name,
      subject: formData.subject.trim(),
      content: formData.content.trim(),
      attachments: [...attachments],
      priority: formData.priority,
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    db.saveMessage(message);
    
    // Create notification for receiver(s)
    if (formData.receiverId) {
      // Single recipient
      db.createNotification({
        companyId,
        userId: formData.receiverId,
        type: 'message_received',
        title: 'Nova Mensagem',
        message: `${authState.user?.name} enviou: ${formData.subject}`,
        data: { messageId: message.id },
        priority: formData.priority
      });
    } else {
      // All users
      users.filter(u => u.id !== currentUserId).forEach(user => {
        db.createNotification({
          companyId,
          userId: user.id,
          type: 'message_received',
          title: 'Nova Mensagem (Geral)',
          message: `${authState.user?.name} enviou: ${formData.subject}`,
          data: { messageId: message.id },
          priority: formData.priority
        });
      });
    }
    
    loadData();
    toast.success('Mensagem enviada com sucesso!');
    setIsDialogOpen(false);
    resetForm();
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsViewDialogOpen(true);
    
    // Mark as read if it's a received message
    if (message.receiverId === currentUserId || (!message.receiverId && message.senderId !== currentUserId)) {
      if (message.status === 'sent') {
        const updatedMessage = {
          ...message,
          status: 'read' as const,
          readAt: new Date().toISOString()
        };
        db.saveMessage(updatedMessage);
        loadData();
      }
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
      db.deleteMessage(messageId, companyId);
      loadData();
      toast.success('Mensagem excluída com sucesso!');
    }
  };

  const downloadAttachment = (attachment: MessageAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baixa' },
      medium: { color: 'bg-blue-100 text-blue-800', label: 'Média' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (message: Message) => {
    if (message.status === 'read') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicação Interna</h1>
          <p className="text-gray-600 mt-1">Envie mensagens e anexos para sua equipe</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nova Mensagem</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
              <DialogDescription>
                Envie uma mensagem para um usuário específico ou para todos
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receiverId">Destinatário</Label>
                  <Select value={formData.receiverId} onValueChange={(value) => setFormData(prev => ({ ...prev, receiverId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destinatário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os usuários</SelectItem>
                      {users.filter(u => u.id !== currentUserId).map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value: keyof typeof PRIORITY_TYPES) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Assunto da mensagem"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Mensagem *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Anexos</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('attachments')?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Anexar Arquivos
                  </Button>
                </div>
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{attachment.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList>
          <TabsTrigger value="received">
            Recebidas ({receivedMessages.filter(m => m.status === 'sent').length})
          </TabsTrigger>
          <TabsTrigger value="sent">Enviadas ({sentMessages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              {receivedMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma mensagem recebida
                  </h3>
                  <p className="text-gray-600">
                    Você será notificado quando receber novas mensagens
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        message.status === 'sent' ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{message.subject}</h4>
                            {getPriorityBadge(message.priority)}
                            {getStatusIcon(message)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            De: {message.senderName}
                          </p>
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {message.content}
                          </p>
                          {message.attachments.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Paperclip className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {message.attachments.length} anexo(s)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              {sentMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma mensagem enviada
                  </h3>
                  <p className="text-gray-600">
                    Comece enviando sua primeira mensagem
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{message.subject}</h4>
                            {getPriorityBadge(message.priority)}
                            {getStatusIcon(message)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Para: {message.receiverName || 'Todos os usuários'}
                          </p>
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {message.content}
                          </p>
                          {message.attachments.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Paperclip className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {message.attachments.length} anexo(s)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.id);
                            }}
                            className="mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedMessage?.subject}</span>
              {selectedMessage && getPriorityBadge(selectedMessage.priority)}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage?.senderName} • {selectedMessage && new Date(selectedMessage.createdAt).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <Label>Para:</Label>
                <p className="text-sm">{selectedMessage.receiverName || 'Todos os usuários'}</p>
              </div>
              
              <div>
                <Label>Mensagem:</Label>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              {selectedMessage.attachments.length > 0 && (
                <div>
                  <Label>Anexos:</Label>
                  <div className="space-y-2 mt-2">
                    {selectedMessage.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{attachment.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}