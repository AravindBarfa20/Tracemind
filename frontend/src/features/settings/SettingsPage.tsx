import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/components/Toast/useToast';
import Card from '@/components/Card/Card';
import Tabs from '@/components/Tabs/Tabs';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import Badge from '@/components/Badge/Badge';
import EmptyState from '@/components/EmptyState/EmptyState';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile edit forms
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Preferences form
  const [theme, setTheme] = useState(() => localStorage.getItem('tracemind_theme') || 'light');

  // Sync theme changes with the HTML document attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tracemind_theme', theme);
  }, [theme]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      addToast('Please fill in required fields', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      // Mock update to backend
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (user) {
        const updated = {
          ...user,
          full_name: fullName,
          email: email
        };
        updateUser(updated);
        addToast('Profile updated successfully!', 'success');
      }
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'apikeys', label: 'API Access Keys', icon: '🔑' }
  ];

  return (
    <div className="settings-view animate-fade-in">
      <Tabs tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} className="settings-tabs" />

      <div className="settings-tab-content">
        {activeTab === 'profile' && user && (
          <div className="profile-settings-layout">
            <Card variant="default" className="profile-form-card">
              <Card.Header>
                <h3 className="panel-subheading">Personal Profile Details</h3>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                  <Input
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isUpdating}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isUpdating}
                  />

                  <div className="input-field-group">
                    <label className="input-label">System User Role</label>
                    <input
                      type="text"
                      value={user.role}
                      disabled
                      className="form-readonly-input font-mono text-capitalize"
                    />
                    <p className="input-helper-msg">Your role is managed by your organization administrator.</p>
                  </div>

                  <div className="form-action-row">
                    <Button type="submit" variant="primary" isLoading={isUpdating}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>

            <Card variant="default" className="profile-meta-card">
              <Card.Header>
                <h3 className="panel-subheading">Security Details</h3>
              </Card.Header>
              <Card.Body className="security-meta-body">
                <div className="security-property-row">
                  <span className="label">Registered At</span>
                  <span className="value">
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(user.created_at))}
                  </span>
                </div>
                <div className="security-property-row">
                  <span className="label">Password</span>
                  <span className="value">••••••••</span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => addToast('Reset password link sent (Mocked)', 'success')}
                  className="change-password-btn"
                >
                  Change Password
                </Button>
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="profile-settings-layout">
            <Card variant="default">
              <Card.Header>
                <h3 className="panel-subheading">Interface Settings</h3>
              </Card.Header>
              <Card.Body>
                <div className="preference-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)' }}>Interface Theme</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>Choose light or dark aesthetics.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant={theme === 'light' ? 'primary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setTheme('light')}
                    >
                      ☀️ Light Mode
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'primary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setTheme('dark')}
                    >
                      🌙 Dark Mode
                    </Button>
                  </div>
                </div>

                <div className="preference-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)' }}>Telemetry Live Poll</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>Automatically check service registry endpoint status in the background.</p>
                  </div>
                  <Badge variant="success" size="sm">Enabled (30s interval)</Badge>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'apikeys' && (
          <EmptyState
            title="API Access Keys coming in Phase 3"
            description="Generate access keys to authenticate your microservices agents telemetry logs collectors pushes."
            icon="🔑"
            actionLabel="Generate Mock Key"
            onAction={() => addToast('tm_live_7a8b9c0d1e2f3a4b5c6d5e6f (Mock Key copied!)', 'success')}
          />
        )}
      </div>
    </div>
  );
};
export default SettingsPage;
