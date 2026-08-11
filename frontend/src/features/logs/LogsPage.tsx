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
import './LogsPage.css';

interface LogItem {
  id: string;
  service_id: string;
  timestamp: string;
  level: string;
  message: string;
  attributes: Record<string, any>;
}

export const LogsPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Form states to ingest mock log
  const [ingestService, setIngestService] = useState('');
  const [ingestLevel, setIngestLevel] = useState('INFO');
  const [ingestMessage, setIngestMessage] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load services for selector dropdowns
  const { data: servicesData } = useServices();
  const services = servicesData?.items || [];

  // Automatically select first service for ingestion form
  useEffect(() => {
    if (services.length > 0 && !ingestService) {
      setIngestService(services[0].id);
    }
  }, [services, ingestService]);

  // Query logs list
  const qs = new URLSearchParams();
  if (selectedService !== 'all') qs.set('service_id', selectedService);
  if (levelFilter !== 'all') qs.set('level', levelFilter);
  if (debouncedSearch) qs.set('search', debouncedSearch);

  const { data: logs, isLoading, error } = useQuery<LogItem[]>({
    queryKey: ['logs', selectedService, levelFilter, debouncedSearch],
    queryFn: () => apiClient.get(`/telemetry/logs?${qs.toString()}`),
    refetchInterval: 10000, // auto-refresh every 10s
  });

  // Mutation to ingest a new log line
  const ingestMutation = useMutation({
    mutationFn: (data: { service_id: string; level: string; message: string; attributes: any }) =>
      apiClient.post('/telemetry/logs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      setIngestMessage('');
      addToast('Mock log ingested successfully into DB!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to ingest log', 'error');
    }
  });

  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestService) {
      addToast('Please select a service first. Register one if needed.', 'error');
      return;
    }
    if (!ingestMessage.trim()) return;

    ingestMutation.mutate({
      service_id: ingestService,
      level: ingestLevel,
      message: ingestMessage,
      attributes: { environment: 'production', host: 'k8s-pod-x9' }
    });
  };

  const getLevelBadgeVariant = (lvl: string) => {
    const l = lvl.toUpperCase();
    if (l === 'ERROR' || l === 'CRITICAL' || l === 'FATAL') return 'error';
    if (l === 'WARN' || l === 'WARNING') return 'warning';
    if (l === 'SUCCESS') return 'success';
    if (l === 'DEBUG') return 'neutral';
    return 'info';
  };

  return (
    <div className="logs-page-view animate-fade-in">
      <div className="logs-grid-layout">
        
        {/* Left Side: Filter and Ingest Form */}
        <div className="logs-sidebar-controls">
          <Card variant="default">
            <Card.Header>
              <h3 className="logs-panel-heading">Telemetry Filters</h3>
            </Card.Header>
            <Card.Body className="logs-filters-body">
              <div className="filter-item-group">
                <label className="filter-label">Filter by Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="logs-select-control"
                >
                  <option value="all">All Services</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item-group">
                <label className="filter-label">Filter by Level</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="logs-select-control"
                >
                  <option value="all">All Levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                  <option value="DEBUG">DEBUG</option>
                </select>
              </div>

              <Input
                placeholder="Search log messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon="🔍"
              />
            </Card.Body>
          </Card>

          {/* Ingest Mock Log Card */}
          <Card variant="default" className="logs-ingest-card">
            <Card.Header>
              <h3 className="logs-panel-heading">Ingest Mock Log</h3>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleIngestSubmit} className="logs-ingest-form">
                <div className="filter-item-group">
                  <label className="filter-label">Target Service</label>
                  <select
                    value={ingestService}
                    onChange={(e) => setIngestService(e.target.value)}
                    className="logs-select-control"
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
                  <label className="filter-label">Severity Level</label>
                  <select
                    value={ingestLevel}
                    onChange={(e) => setIngestLevel(e.target.value)}
                    className="logs-select-control"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="DEBUG">DEBUG</option>
                  </select>
                </div>

                <Input
                  label="Log Message"
                  placeholder="e.g. Connection pool exhausted at pool-03"
                  value={ingestMessage}
                  onChange={(e) => setIngestMessage(e.target.value)}
                  disabled={ingestMutation.isPending}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={ingestMutation.isPending}
                >
                  🚀 Ingest Log Line
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>

        {/* Right Side: Log Stream Output Console */}
        <div className="logs-stream-container">
          <Card variant="default" className="logs-console-card">
            <Card.Header
              action={
                <Badge variant="success" size="sm">Streaming Live</Badge>
              }
            >
              <h3 className="logs-panel-heading">Logs Console</h3>
            </Card.Header>
            <Card.Body className="logs-console-body">
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton shape="text" width="90%" height={14} />
                  <Skeleton shape="text" width="80%" height={14} />
                  <Skeleton shape="text" width="95%" height={14} />
                  <Skeleton shape="text" width="70%" height={14} />
                </div>
              ) : error ? (
                <div style={{ color: 'var(--color-error-500)', padding: '24px 0', textAlign: 'center' }}>
                  ⚠️ Failed to load logs: {(error as any).message || 'Server connection error.'}
                </div>
              ) : !logs || logs.length === 0 ? (
                <EmptyState
                  title="No logs found"
                  description="Use the ingestion panel on the left to inject simulated log events into the Postgres database."
                  icon="📋"
                />
              ) : (
                <div className="logs-monospace-stream">
                  {logs.map((log) => (
                    <div key={log.id} className="logs-line-row animate-slide-up">
                      <span className="log-line-time">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant={getLevelBadgeVariant(log.level)} size="sm" className="log-line-badge font-mono">
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="log-line-message">{log.message}</span>
                      {Object.keys(log.attributes).length > 0 && (
                        <span className="log-line-attributes">
                          {JSON.stringify(log.attributes)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default LogsPage;
