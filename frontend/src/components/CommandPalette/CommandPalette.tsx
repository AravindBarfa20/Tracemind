import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  extraItems?: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, extraItems = [] }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const defaultItems: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', description: 'System overview & metrics', icon: '📊', category: 'Navigation', action: () => navigate('/'), keywords: ['home', 'overview'] },
    { id: 'nav-services', label: 'Go to Services', description: 'Manage registered services', icon: '🔧', category: 'Navigation', action: () => navigate('/services'), keywords: ['registry', 'list'] },
    { id: 'nav-settings', label: 'Go to Settings', description: 'Profile & preferences', icon: '⚙️', category: 'Navigation', action: () => navigate('/settings'), keywords: ['profile', 'config'] },
    // Actions
    { id: 'act-new-service', label: 'Register New Service', description: 'Add a microservice to registry', icon: '➕', category: 'Actions', action: () => navigate('/services/new'), keywords: ['create', 'add'] },
    { id: 'act-traces', label: 'Browse Traces', description: 'Distributed tracing — Phase 3', icon: '📡', category: 'Actions', action: () => {}, keywords: ['tracing', 'spans'] },
    { id: 'act-logs', label: 'Search Logs', description: 'Structured log search — Phase 3', icon: '📋', category: 'Actions', action: () => {}, keywords: ['logging', 'stdout'] },
    { id: 'act-incidents', label: 'View Incidents', description: 'Incident management — Phase 3', icon: '🚨', category: 'Actions', action: () => {}, keywords: ['alerts', 'pagerduty'] },
    { id: 'act-ai', label: 'Ask AI Assistant', description: 'AI investigation hints — Phase 3', icon: '🤖', category: 'Actions', action: () => {}, keywords: ['llm', 'ollama', 'groq'] },
  ];

  const allItems = [...defaultItems, ...extraItems];

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.includes(q))
    );
  }, [query, allItems]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector('.cp-item.selected');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = -1;

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-container animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="cp-search-section">
          <svg className="cp-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            className="cp-search-input"
            type="text"
            placeholder="Type a command or search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cp-kbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="cp-results" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="cp-empty">
              <span className="cp-empty-icon">🔍</span>
              <p>No results for "{query}"</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="cp-group">
                <div className="cp-group-label">{category}</div>
                {items.map(item => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={item.id}
                      className={`cp-item ${idx === selectedIndex ? 'selected' : ''}`}
                      onClick={() => { item.action(); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="cp-item-icon">{item.icon}</span>
                      <div className="cp-item-text">
                        <span className="cp-item-label">{item.label}</span>
                        {item.description && (
                          <span className="cp-item-desc">{item.description}</span>
                        )}
                      </div>
                      {idx === selectedIndex && (
                        <kbd className="cp-item-enter">↵</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="cp-footer">
          <div className="cp-footer-hints">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
