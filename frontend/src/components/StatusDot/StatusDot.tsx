import React from 'react';
import './StatusDot.css';

interface StatusDotProps {
  status: 'healthy' | 'degraded' | 'down' | 'unknown' | 'active' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 'md',
  label,
  className = '',
}) => {
  // Normalize statuses to style classes
  const mappedStatus = 
    status === 'healthy' || status === 'active' ? 'healthy' :
    status === 'degraded' ? 'degraded' :
    status === 'down' || status === 'inactive' ? 'down' : 'unknown';

  const shouldPulse = mappedStatus === 'healthy' || mappedStatus === 'degraded';

  return (
    <div className={`status-dot-wrapper ${className}`}>
      <span className={`status-dot ${mappedStatus} ${size} ${shouldPulse ? 'animate-pulse' : ''}`} />
      {label && <span className="status-dot-label">{label}</span>}
    </div>
  );
};
export default StatusDot;
