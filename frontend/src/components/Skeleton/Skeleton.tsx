import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  shape?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  shape = 'rect',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  const renderItem = (idx: number) => {
    return (
      <div
        key={idx}
        className={`skeleton ${shape} animate-shimmer ${className}`}
        style={getStyle()}
      />
    );
  };

  if (count > 1 && shape === 'text') {
    return (
      <div className="skeleton-text-container">
        {Array.from({ length: count }).map((_, idx) => renderItem(idx))}
      </div>
    );
  }

  return renderItem(0);
};
export default Skeleton;
