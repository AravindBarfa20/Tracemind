import React from 'react';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`tabs-container ${className}`}>
      <div className="tabs-list" role="tablist">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              className={`tab-item-btn ${active ? 'active' : ''}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.icon && <span className="tab-item-icon">{tab.icon}</span>}
              <span className="tab-item-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default Tabs;
