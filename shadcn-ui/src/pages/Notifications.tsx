import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { Notification, NOTIFICATION_TYPES, PRIORITY_TYPES } from '@/lib/types';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MessageSquare,
  Package,
  ClipboardList,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { authState } = useAuth();
  const companyId = authState.company?.id || '';
  const currentUserId = authState.user?.id || '';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, [companyId, currentUserId]);

  const loadNotifications = () => {
    const allNotifications = db.getNotifications(companyId, currentUserId);
    setNotifications(allNotifications);
    
    const unread = allNotifications.filter(n => n.status === 'unread');
    const read = allNotifications.filter(n => n.status === 'read');
    
    setUnreadNotifications(unread);
    setReadNotifications(read);
  };

  const markAsRead = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.status === 'read') return;

    const updatedNotification = {
      ...notification,
      status: 'read' as const,
      readAt: new Date().toISOString()
    };

    db.saveNotification(updatedNotification);
    loadNotifications();
  };

  const markAllAsRead = () => {
    unreadNotifications.forEach(notification => {
      const updatedNotification = {
        ...notification,
        status: 'read' as const,
        readAt: new Date().toISOString()
      };
      db.saveNotification(updatedNotification);
    });
    
    loadNotifications();
    toast.success('Todas as notificações foram marcadas como lidas');
  };

  const deleteNotification = (notificationId: string) => {
    if (confirm('Tem certeza que deseja excluir esta notificação?')) {
      db.deleteNotification(notificationId, companyId);
      loadNotifications();
      toast.success('Notificação excluída com sucesso!');
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      counting_completed: ClipboardList,
      counting_expired: AlertCircle,
      counting_approved: CheckCircle,
      message_received: MessageSquare,
      stock_low: Package,
      system: Bell
    };

    const IconComponent = iconMap[type as keyof typeof iconMap] || Bell;
    return <IconComponent className="h-5 w-5" />;
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

  const getNotificationColor = (notification: Notification) => {
    if (notification.status === 'unread') {
      return notification.priority === 'urgent' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50';
    }
    return 'border-gray-200 bg-white';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <div 
      className={`p-4 border rounded-lg transition-colors ${getNotificationColor(notification)}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-full ${
            notification.status === 'unread' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium">{notification.title}</h4>
              {getPriorityBadge(notification.priority)}
              {notification.status === 'unread' && (
                <Badge className="bg-blue-600 text-white">Nova</Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]}</span>
              <span>{formatTimeAgo(notification.createdAt)}</span>
              {notification.readAt && (
                <span>Lida em {new Date(notification.readAt).toLocaleString('pt-BR')}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {notification.status === 'unread' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notification.id)}
              title="Marcar como lida"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteNotification(notification.id)}
            title="Excluir notificação"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe todas as atualizações e alertas do sistema
          </p>
        </div>
        
        {unreadNotifications.length > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadNotifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.priority === 'urgent' && n.status === 'unread').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => {
                const today = new Date().toDateString();
                const notifDate = new Date(n.createdAt).toDateString();
                return today === notifDate;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="unread" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">
            Não Lidas ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Lidas ({readNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({notifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread">
          <Card>
            <CardHeader>
              <CardTitle>Notificações Não Lidas</CardTitle>
            </CardHeader>
            <CardContent>
              {unreadNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma notificação não lida
                  </h3>
                  <p className="text-gray-600">
                    Você está em dia com todas as notificações!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unreadNotifications
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read">
          <Card>
            <CardHeader>
              <CardTitle>Notificações Lidas</CardTitle>
            </CardHeader>
            <CardContent>
              {readNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma notificação lida
                  </h3>
                  <p className="text-gray-600">
                    As notificações lidas aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readNotifications
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma notificação
                  </h3>
                  <p className="text-gray-600">
                    Você receberá notificações sobre contagens, mensagens e alertas do sistema
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}