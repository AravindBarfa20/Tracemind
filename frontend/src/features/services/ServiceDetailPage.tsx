import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast/useToast';
import { useService, useUpdateService, useDeleteService, useServiceHealth } from '@/hooks/api-hooks';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import Badge from '@/components/Badge/Badge';
import StatusDot from '@/components/StatusDot/StatusDot';
import Card from '@/components/Card/Card';
import Tabs from '@/components/Tabs/Tabs';
import Button from '@/components/Button/Button';
import Skeleton from '@/components/Skeleton/Skeleton';
import Modal from '@/components/Modal/Modal';
import Input from '@/components/Input/Input';
import './ServiceDetailPage.css';

export const ServiceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load real service
  const { data: service, isLoading, error } = useService(slug || '');
  const updateMutation = useUpdateService(slug || '');
  const deleteMutation = useDeleteService();

  // Load live endpoint health
  const { data: healthData, isLoading: isHealthLoading, refetch: refetchHealth } = useServiceHealth(slug || '');

  // Form states for Editing
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBaseUrl, setEditBaseUrl] = useState('');
  const [editHealthEndpoint, setEditHealthEndpoint] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editTags, setEditTags] = useState('');

  const openEditModal = () => {
    if (!service) return;
    setEditName(service.name);
    setEditDescription(service.description || '');
    setEditBaseUrl(service.base_url || '');
    setEditHealthEndpoint(service.health_endpoint || '');
    setEditTeam(service.team || '');
    setEditTags(service.tags ? service.tags.join(', ') : '');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedTags = editTags
        ? editTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await updateMutation.mutateAsync({
        name: editName,
        description: editDescription,
        base_url: editBaseUrl,
        health_endpoint: editHealthEndpoint,
        team: editTeam,
        tags: parsedTags,
      });

      addToast('Service updated successfully!', 'success');
      setIsEditModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to update service', 'error');
    }
  };

  const handleDeactivate = async () => {
    if (!slug) return;
    if (window.confirm('Are you sure you want to deactivate this service registry?')) {
      try {
        await deleteMutation.mutateAsync(slug);
        addToast(`Service deactivated successfully`, 'success');
        navigate('/services');
      } catch (err: any) {
        addToast(err.message || 'Failed to deactivate service', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="service-detail-view animate-fade-in" style={{ gap: '24px' }}>
        <Skeleton shape="rect" width={200} height={20} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '40%' }}>
            <Skeleton shape="text" count={2} />
          </div>
          <Skeleton shape="rect" width={150} height={40} />
        </div>
        <Skeleton shape="rect" width="100%" height={40} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <Skeleton shape="rect" width="100%" height={200} />
          <Skeleton shape="rect" width="100%" height={200} />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="service-detail-view">
        <Card variant="default">
          <Card.Body>
            <div style={{ color: 'var(--color-error-500)', textAlign: 'center', padding: '32px 0' }}>
              ⚠️ {(error as any)?.message || 'Service not found or backend API server is unreachable.'}
              <div style={{ marginTop: '16px' }}>
                <Button variant="secondary" onClick={() => navigate('/services')}>Back to Registry</Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📝' },
    { id: 'health', label: 'Health & Telemetry', icon: '⚡' },
    { id: 'config', label: 'Configuration JSON', icon: '⚙️' }
  ];

  const getEnvBadgeVariant = () => {
    switch (service.environment) {
      case 'production': return 'success';
      case 'staging': return 'warning';
      default: return 'info';
    }
  };

  const breadcrumbs = [
    { label: 'Services', path: '/services' },
    { label: service.name }
  ];

  return (
    <div className="service-detail-view animate-fade-in">
      <Breadcrumbs items={breadcrumbs} className="detail-view-breadcrumbs" />

      {/* Detail header */}
      <div className="detail-view-header-banner">
        <div className="header-banner-left">
          <div className="title-and-status-row">
            <h2 className="detail-service-title">{service.name}</h2>
            <StatusDot status={service.status === 'active' ? 'healthy' : 'down'} label={service.status} />
          </div>
          
          <div className="meta-badges-row">
            <Badge variant="default" size="sm" className="font-mono text-uppercase">
              {service.service_type}
            </Badge>
            <Badge variant={getEnvBadgeVariant()} size="sm" className="text-capitalize">
              {service.environment}
            </Badge>
            <span className="team-text-label">Team: <strong>{service.team || 'Unassigned'}</strong></span>
          </div>
        </div>

        <div className="header-banner-right">
          <Button variant="secondary" size="sm" onClick={openEditModal}>
            ✏️ Edit Service
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeactivate} isLoading={deleteMutation.isPending}>
            🗑️ Deactivate
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} className="detail-view-tabs" />

      {/* Active tab content */}
      <div className="detail-tab-content-area">
        {activeTab === 'overview' && (
          <div className="overview-tab-grid">
            
            {/* Left Column details */}
            <div className="overview-left-col">
              <Card variant="default">
                <Card.Header>
                  <h3 className="panel-subheading">Description</h3>
                </Card.Header>
                <Card.Body>
                  <p className="overview-description-text">{service.description || 'No description provided.'}</p>
                </Card.Body>
              </Card>

              <Card variant="default" className="metadata-spec-card">
                <Card.Header>
                  <h3 className="panel-subheading">Platform Properties</h3>
                </Card.Header>
                <Card.Body>
                  <div className="metadata-properties-grid">
                    <div className="meta-property-row">
                      <span className="property-label">Service UUID</span>
                      <span className="property-value font-mono">{service.id}</span>
                    </div>
                    <div className="meta-property-row">
                      <span className="property-label">Created At</span>
                      <span className="property-value font-mono">{new Date(service.created_at).toLocaleString()}</span>
                    </div>
                    <div className="meta-property-row">
                      <span className="property-label">Last Updated</span>
                      <span className="property-value font-mono">{new Date(service.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Right Column details */}
            <div className="overview-right-col">
              <Card variant="default" className="info-specification-card">
                <Card.Header>
                  <h3 className="panel-subheading">Network Specifications</h3>
                </Card.Header>
                <Card.Body className="network-spec-body">
                  <div className="spec-item">
                    <span className="spec-label">Base URL</span>
                    <span className="spec-value font-mono truncate-url" title={service.base_url || ''}>
                      {service.base_url || 'Not configured'}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Health Check URL</span>
                    <span className="spec-value font-mono truncate-url" title={service.health_endpoint || ''}>
                      {service.health_endpoint || 'Not configured'}
                    </span>
                  </div>
                </Card.Body>
              </Card>

              <Card variant="default" className="tags-card-panel">
                <Card.Header>
                  <h3 className="panel-subheading">Metadata Tags</h3>
                </Card.Header>
                <Card.Body>
                  <div className="tags-badges-list">
                    {service.tags && service.tags.length > 0 ? (
                      service.tags.map((tag) => (
                        <Badge key={tag} variant="neutral" size="md">
                          #{tag}
                        </Badge>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No tags added.</span>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>

          </div>
        )}

        {activeTab === 'health' && (
          <Card variant="default">
            <Card.Header 
              action={
                <Button variant="ghost" size="sm" onClick={() => refetchHealth()} isLoading={isHealthLoading}>
                  🔄 Check Now
                </Button>
              }
            >
              <h3 className="panel-subheading">Live Health Telemetry</h3>
            </Card.Header>
            <Card.Body>
              {isHealthLoading ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <Skeleton shape="text" count={2} />
                </div>
              ) : healthData ? (
                <div className="live-health-data-grid">
                  <div className="health-stat-card">
                    <span className="stat-label">Endpoint Status</span>
                    <span className={`stat-val ${healthData.status === 'healthy' ? 'success' : 'error'}`} style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {healthData.status}
                    </span>
                  </div>
                  <div className="health-stat-card">
                    <span className="stat-label">Ping Latency</span>
                    <span className="stat-val font-mono">{healthData.latency_ms}ms</span>
                  </div>
                  <div className="health-stat-card">
                    <span className="stat-label">Checked At</span>
                    <span className="stat-val font-mono" style={{ fontSize: '12px' }}>
                      {new Date(healthData.checked_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-tertiary)' }}>
                  No health check records. Click "Check Now" to query the live status of the service's endpoint.
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'config' && (
          <Card variant="default">
            <Card.Header>
              <h3 className="panel-subheading">Registered Schema JSON</h3>
            </Card.Header>
            <Card.Body>
              <pre className="json-configuration-block">
                {JSON.stringify(service, null, 2)}
              </pre>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${service.name}`}
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Service Name *"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            disabled={updateMutation.isPending}
          />
          <div className="input-field-group">
            <label className="input-label">Description / Purpose</label>
            <textarea
              className="form-textarea-control"
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
          <Input
            label="Base URL"
            value={editBaseUrl}
            onChange={(e) => setEditBaseUrl(e.target.value)}
            disabled={updateMutation.isPending}
          />
          <Input
            label="Health Check Endpoint"
            value={editHealthEndpoint}
            onChange={(e) => setEditHealthEndpoint(e.target.value)}
            disabled={updateMutation.isPending}
          />
          <Input
            label="Owner Team / Squad"
            value={editTeam}
            onChange={(e) => setEditTeam(e.target.value)}
            disabled={updateMutation.isPending}
          />
          <Input
            label="Tags (Comma separated)"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            disabled={updateMutation.isPending}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={updateMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ServiceDetailPage;
