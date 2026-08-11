import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Bell, X } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const renderIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} />;
      case 'error': return <AlertCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <Info size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className={`toast-notification ${type} animate-scale-in`}>
      <span className="toast-icon">{renderIcon()}</span>
      <p className="toast-message-text">{message}</p>
      <button className="toast-close-btn" onClick={() => onClose(id)}><X size={14} /></button>
    </div>
  );
};
export default Toast;
