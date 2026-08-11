import React from 'react';
import Button from '../Button/Button';
import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state-wrapper ${className}`}>
      {icon && <div className="empty-state-icon animate-float">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="empty-state-action-btn">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
