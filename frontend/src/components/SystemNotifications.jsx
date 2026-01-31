import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  Bell, X, Check, CheckCheck, Database, AlertTriangle, 
  Shield, Server, Info, Loader2, Trash2
} from 'lucide-react';

const API_URL = getApiUrl();

const SystemNotifications = ({ getAuthHeaders }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notifications/system?limit=20`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching system notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/notifications/system/${notificationId}/mark-read`, {
        method: 'POST',
        headers
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/notifications/system/mark-all-read`, {
        method: 'POST',
        headers
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification (superadmin only)
  const deleteNotification = async (notificationId) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notifications/system/${notificationId}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Get icon based on notification type
  const getNotificationIcon = (type, severity) => {
    const iconClass = severity === 'critical' ? 'text-red-400' : 
                     severity === 'warning' ? 'text-amber-400' : 
                     severity === 'error' ? 'text-red-400' : 'text-green-400';
    
    switch (type) {
      case 'backup_success':
        return <Database className={`w-5 h-5 ${iconClass}`} />;
      case 'backup_failed':
        return <Database className="w-5 h-5 text-red-400" />;
      case 'error_alert':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'security_alert':
        return <Shield className="w-5 h-5 text-amber-400" />;
      case 'uptime_alert':
        return <Server className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        data-testid="system-notifications-bell"
      >
        <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-medium">Notificaciones del Sistema</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#d4a968] hover:text-[#e5ba79] flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#d4a968] animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !notification.read_by?.length ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`mt-0.5 p-2 rounded-lg ${
                      notification.severity === 'critical' ? 'bg-red-500/20' :
                      notification.severity === 'warning' ? 'bg-amber-500/20' :
                      notification.severity === 'error' ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      {getNotificationIcon(notification.type, notification.severity)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2">
                        {!notification.read_by?.length && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-[#d4a968] hover:text-[#e5ba79] flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marcar leída
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-white/10 text-center">
              <button
                onClick={fetchNotifications}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 mx-auto"
              >
                <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemNotifications;
