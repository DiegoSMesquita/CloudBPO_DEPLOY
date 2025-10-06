import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';

interface NotificationData {
  countingId?: string;
  countingName?: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: 'counting_completed' | 'counting_approved' | 'internal_message' | 'announcement';
  title: string;
  message: string;
  data?: NotificationData;
  read: boolean;
  createdAt: string;
}

export const NotificationSystem: React.FC = () => {
  const { authState } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (authState.company?.id) {
      loadNotifications();
      
      // Check for new notifications every 30 seconds
      const interval = setInterval(() => {
        checkForNewNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [authState.company]);

  const loadNotifications = async () => {
    if (!authState.company?.id) return;
    
    try {
      // Simulate loading notifications - in real app, this would be from database
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'counting_completed',
          title: 'Contagem Finalizada',
          message: 'A contagem "Estoque Janeiro 2024" foi finalizada e está aguardando aprovação.',
          data: { countingId: 'counting-1', countingName: 'Estoque Janeiro 2024' },
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'counting_approved',
          title: 'Contagem Aprovada',
          message: 'A contagem "Estoque Dezembro 2023" foi aprovada e os estoques foram atualizados.',
          data: { countingId: 'counting-2', countingName: 'Estoque Dezembro 2023' },
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: '3',
          type: 'internal_message',
          title: 'Mensagem Interna',
          message: 'Nova política de contagem de estoque foi implementada. Verifique as diretrizes atualizadas.',
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: '4',
          type: 'announcement',
          title: 'Comunicado',
          message: 'Sistema será atualizado no próximo domingo das 02:00 às 06:00.',
          read: false,
          createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkForNewNotifications = async () => {
    if (!authState.company?.id) return;
    
    try {
      // Check for completed countings that need approval
      const countings = await db.getCountingsAsync(authState.company.id);
      const completedCountings = countings.filter(c => c.status === 'completed');
      
      // Create notifications for completed countings
      const newNotifications: Notification[] = [];
      
      completedCountings.forEach(counting => {
        // Check if we already have a notification for this counting
        const existingNotification = notifications.find(n => 
          n.type === 'counting_completed' && 
          n.data?.countingId === counting.id
        );
        
        if (!existingNotification) {
          newNotifications.push({
            id: `counting-completed-${counting.id}`,
            type: 'counting_completed',
            title: 'Contagem Finalizada',
            message: `A contagem "${counting.name}" foi finalizada e está aguardando aprovação.`,
            data: { countingId: counting.id, countingName: counting.name },
            read: false,
            createdAt: counting.completedAt || new Date().toISOString()
          });
        }
      });
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        setUnreadCount(prev => prev + newNotifications.length);
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'counting_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'counting_approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'internal_message':
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      case 'announcement':
        return <Info className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'counting_completed':
        return 'border-l-green-500 bg-green-50';
      case 'counting_approved':
        return 'border-l-blue-500 bg-blue-50';
      case 'internal_message':
        return 'border-l-purple-500 bg-purple-50';
      case 'announcement':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificações"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                  } border-b border-gray-100 last:border-b-0 hover:bg-opacity-75 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'} leading-relaxed`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100"
                              >
                                Marcar como lida
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-100"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Navigate to notifications page if it exists
                }}
                className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationSystem;