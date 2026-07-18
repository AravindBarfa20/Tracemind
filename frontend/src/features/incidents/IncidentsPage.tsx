import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useServices } from '@/hooks/api-hooks';
import Card from '@/components/Card/Card';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Badge from '@/components/Badge/Badge';
import Skeleton from '@/components/Skeleton/Skeleton';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useToast } from '@/components/Toast/useToast';
import './IncidentsPage.css';

interface IncidentItem {
  id: string;
  service_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export const IncidentsPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Trigger form states
  const [triggerService, setTriggerService] = useState('');
  const [triggerTitle, setTriggerTitle] = useState('');
  const [triggerDesc, setTriggerDesc] = useState('');
  const [triggerSeverity, setTriggerSeverity] = useState('critical');

  // Load services list
  const { data: servicesData } = useServices();
  const services = servicesData?.items || [];

  // Auto select service source
  useEffect(() => {
    if (services.length > 0 && !triggerService) {
      setTriggerService(services[0].id);
    }
  }, [services, triggerService]);

  // Query incidents
  const qs = new URLSearchParams();
  if (selectedService !== 'all') qs.set('service_id', selectedService);
  if (statusFilter !== 'all') qs.set('status', statusFilter);

  const { data: incidents, isLoading, error } = useQuery<IncidentItem[]>({
    queryKey: ['incidents', selectedService, statusFilter],
    queryFn: () => apiClient.get(`/incidents?${qs.toString()}`),
    refetchInterval: 10000,
  });

  // Mutation to trigger a new mock incident
  const triggerMutation = useMutation({
    mutationFn: (data: { service_id: string; title: string; description: string; severity: string }) =>
      apiClient.post('/incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setTriggerTitle('');
      setTriggerDesc('');
      addToast('Alert triggered successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to trigger alert', 'error');
    }
  });

  // Mutation to update incident status (acknowledge/resolve)
  const statusMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      apiClient.put(`/incidents/${data.id}/status`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      addToast('Incident triage status updated!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update status', 'error');
    }
  });

  const handleTriggerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerService) {
      addToast('Please select a service first.', 'error');
      return;
    }
    if (!triggerTitle.trim()) return;

    triggerMutation.mutate({
      service_id: triggerService,
      title: triggerTitle,
      description: triggerDesc,
      severity: triggerSeverity
    });
  };

  const getSeverityBadgeVariant = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === 'critical') return 'error';
    if (s === 'warning') return 'warning';
    return 'info';
  };

  const getStatusBadgeVariant = (st: string) => {
    const s = st.toLowerCase();
    if (s === 'resolved') return 'success';
    if (s === 'acknowledged') return 'warning';
    return 'error';
  };

  const getServiceName = (id: string) => {
    const s = services.find(srv => srv.id === id);
    return s ? s.name : 'Unknown Service';
  };

  return (
    <div className="incidents-page-view animate-fade-in">
      <div className="incidents-grid-layout">
        
        {/* Left: Incident triage stream list */}
        <div className="incidents-stream-column">
          <div className="incidents-filter-header">
            <div className="filter-dropdown-select-group">
              <span className="dropdown-label">Service</span>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="incidents-select-control"
              >
                <option value="all">All Services</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-dropdown-select-group">
              <span className="dropdown-label">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="incidents-select-control"
              >
                <option value="all">All Statuses</option>
                <option value="triggered">Triggered</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton shape="rect" width="100%" height={120} />
              <Skeleton shape="rect" width="100%" height={120} />
            </div>
          ) : error ? (
            <Card variant="default">
              <Card.Body>
                <div style={{ color: 'var(--color-error-500)', textAlign: 'center', padding: '24px 0' }}>
                  ⚠️ Failed to load incidents: {(error as any).message || 'Server connection error.'}
                </div>
              </Card.Body>
            </Card>
          ) : !incidents || incidents.length === 0 ? (
            <EmptyState
              title="No alerts triggered"
              description="Sytem metrics and logs channels are running clean. Trigger a mock alert on the right to test resolving flows."
              icon="🚨"
            />
          ) : (
            <div className="incidents-list-container">
              {incidents.map((incident) => (
                <Card key={incident.id} variant="default" className="incident-alert-card animate-scale-in">
                  <div className="incident-card-top-row">
                    <div className="incident-title-box">
                      <h4 className="incident-card-title">{incident.title}</h4>
                      <span className="incident-service-name">{getServiceName(incident.service_id)}</span>
                    </div>

                    <div className="incident-badges-tags">
                      <Badge variant={getSeverityBadgeVariant(incident.severity)} size="sm" className="text-uppercase font-mono">
                        {incident.severity}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(incident.status)} size="sm" className="text-uppercase font-mono">
                        {incident.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="incident-description-body">{incident.description || 'No description provided.'}</p>

                  <div className="incident-card-bottom-actions">
                    <span className="incident-time-stamp">
                      Triggered {new Date(incident.created_at).toLocaleString()}
                    </span>

                    <div className="incident-action-buttons-group">
                      {incident.status === 'triggered' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => statusMutation.mutate({ id: incident.id, status: 'acknowledged' })}
                          isLoading={statusMutation.isPending}
                        >
                          👁️ Acknowledge
                        </Button>
                      )}
                      {incident.status !== 'resolved' && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          onClick={() => statusMutation.mutate({ id: incident.id, status: 'resolved' })}
                          isLoading={statusMutation.isPending}
                        >
                          ✅ Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right: Simulation trigger form */}
        <div className="incidents-simulation-column">
          <Card variant="default">
            <Card.Header>
              <h3 className="incidents-panel-heading">Trigger Mock Incident</h3>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleTriggerSubmit} className="incidents-trigger-form">
                <div className="filter-item-group">
                  <label className="filter-label">Source Service</label>
                  <select
                    value={triggerService}
                    onChange={(e) => setTriggerService(e.target.value)}
                    className="incidents-select-control"
                    required
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    {services.length === 0 && (
                      <option value="">No services registered</option>
                    )}
                  </select>
                </div>

                <div className="filter-item-group">
                  <label className="filter-label">Severity</label>
                  <select
                    value={triggerSeverity}
                    onChange={(e) => setTriggerSeverity(e.target.value)}
                    className="incidents-select-control"
                  >
                    <option value="critical">🔴 CRITICAL</option>
                    <option value="warning">🟡 WARNING</option>
                    <option value="info">🔵 INFO</option>
                  </select>
                </div>

                <Input
                  label="Incident Title"
                  placeholder="e.g. Memory leak warning: Heap usage > 90%"
                  value={triggerTitle}
                  onChange={(e) => setTriggerTitle(e.target.value)}
                  required
                />

                <div className="input-field-group">
                  <label className="input-label">Detailed Context</label>
                  <textarea
                    rows={3}
                    placeholder="Enter exception payload details..."
                    value={triggerDesc}
                    onChange={(e) => setTriggerDesc(e.target.value)}
                    className="form-textarea-control"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={triggerMutation.isPending}
                >
                  🚨 Trigger Alert
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default IncidentsPage;
