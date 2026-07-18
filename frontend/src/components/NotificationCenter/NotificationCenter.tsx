import React, { useState, useRef, useEffect } from 'react';
import './NotificationCenter.css';

interface Notification {
  id: string;
  type: 'alert' | 'deployment' | 'health' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  service?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'alert', title: 'High Error Rate Detected', message: 'Payment Gateway error rate spiked to 4.2% in production', timestamp: new Date(Date.now() - 5 * 60000), isRead: false, service: 'payment-gateway' },
  { id: '2', type: 'deployment', title: 'Deployment Completed', message: 'User Auth Service v2.4.1 deployed to staging', timestamp: new Date(Date.now() - 22 * 60000), isRead: false, service: 'user-auth' },
  { id: '3', type: 'health', title: 'Service Recovered', message: 'Order Processing health check passed after 3 retries', timestamp: new Date(Date.now() - 45 * 60000), isRead: true, service: 'order-processing' },
  { id: '4', type: 'warning', title: 'Latency Threshold Exceeded', message: 'Analytics Worker p99 latency exceeded 500ms threshold', timestamp: new Date(Date.now() - 2 * 3600000), isRead: true, service: 'analytics-worker' },
  { id: '5', type: 'info', title: 'Scheduled Maintenance', message: 'Database maintenance window: Jul 20, 02:00-04:00 UTC', timestamp: new Date(Date.now() - 5 * 3600000), isRead: true },
  { id: '6', type: 'deployment', title: 'Deployment Started', message: 'Notification Service v1.8.0 building for production', timestamp: new Date(Date.now() - 8 * 3600000), isRead: true, service: 'notification-service' },
];

const typeConfig: Record<string, { icon: string; color: string }> = {
  alert: { icon: '🚨', color: 'var(--color-error-500)' },
  deployment: { icon: '🚀', color: 'var(--color-info-500)' },
  health: { icon: '💚', color: 'var(--color-success-500)' },
  info: { icon: 'ℹ️', color: 'var(--color-info-500)' },
  warning: { icon: '⚠️', color: 'var(--color-warning-500)' },
};

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  return (
    <div className="nc-wrapper" ref={panelRef}>
      <button
        className={`nc-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="nc-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="nc-panel animate-slide-down-fade">
          <div className="nc-panel-header">
            <h3 className="nc-panel-title">Notifications</h3>
            {unreadCount > 0 && (
              <button className="nc-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="nc-panel-list">
            {notifications.length === 0 ? (
              <div className="nc-empty">
                <span className="nc-empty-icon">🔔</span>
                <p>All caught up!</p>
                <span className="nc-empty-desc">No new notifications</span>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  className={`nc-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="nc-item-icon-wrap" style={{ '--nc-icon-color': typeConfig[notif.type]?.color } as React.CSSProperties}>
                    <span>{typeConfig[notif.type]?.icon}</span>
                  </div>
                  <div className="nc-item-body">
                    <span className="nc-item-title">{notif.title}</span>
                    <span className="nc-item-message">{notif.message}</span>
                    <span className="nc-item-time">{formatRelativeTime(notif.timestamp)}</span>
                  </div>
                  {!notif.isRead && <span className="nc-unread-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
