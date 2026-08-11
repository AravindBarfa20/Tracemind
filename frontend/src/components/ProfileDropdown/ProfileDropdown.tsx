import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings, Key, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import Avatar from '../Avatar/Avatar';
import './ProfileDropdown.css';

export const ProfileDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  if (!user) return null;

  const menuItems = [
    { id: 'profile', icon: <UserIcon size={16} />, label: 'Profile', action: () => navigate('/settings') },
    { id: 'settings', icon: <Settings size={16} />, label: 'Settings', action: () => navigate('/settings') },
    { id: 'api-keys', icon: <Key size={16} />, label: 'API Keys', action: () => navigate('/settings') },
    { id: 'divider', icon: null, label: '', action: () => {} },
    { id: 'signout', icon: <LogOut size={16} />, label: 'Sign Out', action: () => { logout(); navigate('/login'); } },
  ];

  return (
    <div className="pd-wrapper" ref={dropdownRef}>
      <button
        className={`pd-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Profile Menu"
      >
        <Avatar name={user.full_name} size="sm" status="online" />
        <span className="pd-trigger-name">{user.full_name.split(' ')[0]}</span>
        <ChevronDown size={14} className="pd-chevron" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
      </button>

      {isOpen && (
        <div className="pd-menu animate-slide-down-fade">
          <div className="pd-menu-user-section">
            <Avatar name={user.full_name} size="md" status="online" />
            <div className="pd-menu-user-info">
              <span className="pd-user-name">{user.full_name}</span>
              <span className="pd-user-email">{user.email}</span>
              <span className="pd-user-role">{user.role}</span>
            </div>
          </div>

          <div className="pd-menu-divider" />

          {menuItems.map(item => {
            if (item.id === 'divider') {
              return <div key="divider" className="pd-menu-divider" />;
            }
            return (
              <button
                key={item.id}
                className={`pd-menu-item ${item.id === 'signout' ? 'danger' : ''}`}
                onClick={() => { item.action(); setIsOpen(false); }}
              >
                <span className="pd-menu-item-icon">{item.icon}</span>
                <span className="pd-menu-item-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
