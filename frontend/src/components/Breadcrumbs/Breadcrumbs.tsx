import React from 'react';
import { Link } from 'react-router-dom';
import './Breadcrumbs.css';

export interface BreadcrumbLink {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbLink[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav className={`breadcrumbs-nav ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="breadcrumbs-item">
              {!isLast && item.path ? (
                <Link to={item.path} className="breadcrumb-link-anchor">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb-current">{item.label}</span>
              )}
              {!isLast && <span className="breadcrumb-separator">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
export default Breadcrumbs;
