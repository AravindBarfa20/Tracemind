import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  Radio, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Bot, 
  Settings, 
  LogOut, 
  Hexagon, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import Avatar from '../Avatar/Avatar';
import Badge from '../Badge/Badge';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { type: 'link', path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { type: 'link', path: '/services', label: 'Services', icon: <Server size={18} /> },
    { type: 'divider', label: 'Observability' },
    { type: 'link', path: '/traces', label: 'Traces', icon: <Radio size={18} /> },
    { type: 'link', path: '/logs', label: 'Logs', icon: <FileText size={18} /> },
    { type: 'link', path: '/metrics', label: 'Metrics', icon: <TrendingUp size={18} /> },
    { type: 'divider', label: 'Operations' },
    { type: 'link', path: '/incidents', label: 'Incidents', icon: <AlertTriangle size={18} /> },
    { type: 'link', path: '/ai-assistant', label: 'AI Assistant', icon: <Bot size={18} /> },
  ];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <div className="brand-logo-area">
          <Hexagon className="brand-logo-icon" size={22} />
          {!isCollapsed && <span className="brand-name">Tracemind</span>}
        </div>
        <button 
          className="sidebar-collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav-container">
        <ul className="sidebar-nav-list">
          {navItems.map((item, index) => {
            if (item.type === 'divider') {
              if (isCollapsed) return <hr key={index} className="sidebar-nav-hr" />;
              return (
                <li key={index} className="sidebar-nav-section-title">
                  {item.label}
                </li>
              );
            }

            if (item.type === 'soon') {
              return (
                <li key={index} className="sidebar-nav-item soon" title={`${item.label} (Coming Soon)`}>
                  <span className="nav-item-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="nav-item-label">{item.label}</span>
                      <Badge variant="neutral" size="sm" className="coming-soon-badge">Soon</Badge>
                    </>
                  )}
                </li>
              );
            }

            return (
              <li key={index}>
                <Link
                  to={item.path!}
                  className={`sidebar-nav-item ${isActive(item.path!) ? 'active' : ''}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <hr className="sidebar-nav-hr" />

      {/* Settings (Separate) */}
      <div className="sidebar-settings-area">
        <Link
          to="/settings"
          className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
        >
          <span className="nav-item-icon"><Settings size={18} /></span>
          {!isCollapsed && <span className="nav-item-label">Settings</span>}
        </Link>
      </div>

      {/* User Footer Profile */}
      {user && (
        <div className="sidebar-user-footer">
          <Avatar name={user.full_name} size="sm" status="online" />
          {!isCollapsed && (
            <div className="sidebar-user-details animate-fade-in">
              <p className="user-name-text">{user.full_name}</p>
              <p className="user-role-text">{user.role}</p>
            </div>
          )}
          {!isCollapsed && (
            <button 
              className="user-logout-btn" 
              onClick={logout} 
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
