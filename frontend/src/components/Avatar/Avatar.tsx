import React, { useState } from 'react';
import { generateInitials } from '@/lib/utils';
import './Avatar.css';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;
  const initials = generateInitials(name);

  // Generate a consistent neutral background color based on name string length
  const bgIndex = name.length % 5;
  const bgClass = `bg-variant-${bgIndex}`;

  return (
    <div className={`avatar-container ${size} ${className}`}>
      {showFallback ? (
        <div className={`avatar-fallback ${bgClass}`}>
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          className="avatar-img"
          onError={() => setImageError(true)}
        />
      )}
      
      {status && (
        <span className={`avatar-status-dot ${status}`} />
      )}
    </div>
  );
};
export default Avatar;
