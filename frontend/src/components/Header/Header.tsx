import React, { useState, useEffect } from 'react';
import CommandPalette from '../CommandPalette/CommandPalette';
import NotificationCenter from '../NotificationCenter/NotificationCenter';
import ProfileDropdown from '../ProfileDropdown/ProfileDropdown';
import SystemStatus from '../SystemStatus/SystemStatus';
import './Header.css';

interface HeaderProps {
  title: string;
  breadcrumbs?: string[];
}

export const Header: React.FC<HeaderProps> = ({ title, breadcrumbs = [] }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="app-header">
        {/* Breadcrumbs & Title */}
        <div className="header-left">
          {breadcrumbs.length > 0 && (
            <div className="header-breadcrumbs">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="breadcrumb-item">{crumb}</span>
                  {idx < breadcrumbs.length - 1 && <span className="breadcrumb-separator">/</span>}
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 className="header-page-title">{title}</h1>
        </div>

        {/* Global Actions */}
        <div className="header-right">
          {/* Search Trigger — Opens Command Palette */}
          <button
            className="header-search-trigger"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Search (⌘K)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span className="header-search-placeholder">Search…</span>
            <kbd className="header-search-kbd">⌘K</kbd>
          </button>

          <div className="header-actions-divider" />

          {/* Notification Center */}
          <NotificationCenter />

          {/* System Status */}
          <SystemStatus />

          <div className="header-actions-divider" />

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </header>

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};

export default Header;
