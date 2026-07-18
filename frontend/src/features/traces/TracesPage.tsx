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
import './TracesPage.css';

interface SpanItem {
  id: string;
  trace_id: string;
  span_id: string;
  parent_span_id: Optional<string>;
  name: string;
  service_id: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  attributes: Record<string, any>;
  status: string;
}

type Optional<T> = T | null;

export const TracesPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState('all');
  const [selectedTraceId, setSelectedTraceId] = useState('');
  const [selectedTraceData, setSelectedTraceData] = useState<SpanItem[]>([]);

  // Form states to ingest mock trace spans
  const [ingestService, setIngestService] = useState('');
  const [spanName, setSpanName] = useState('');
  const [spanDuration, setSpanDuration] = useState('45');

  // Load services list
  const { data: servicesData } = useServices();
  const services = servicesData?.items || [];

  // Automatically select first service for form
  useEffect(() => {
    if (services.length > 0 && !ingestService) {
      setIngestService(services[0].id);
    }
  }, [services, ingestService]);

  // Query traces list
  const qs = new URLSearchParams();
  if (selectedService !== 'all') qs.set('service_id', selectedService);
  if (selectedTraceId) qs.set('trace_id', selectedTraceId);

  const { data: spans, isLoading, error } = useQuery<SpanItem[]>({
    queryKey: ['traces', selectedService, selectedTraceId],
    queryFn: () => apiClient.get(`/telemetry/traces?${qs.toString()}`),
    refetchInterval: 10000,
  });

  // Mutation to ingest mock spans
  const ingestSpanMutation = useMutation({
    mutationFn: (data: {
      trace_id: string;
      span_id: string;
      parent_span_id?: string;
      name: string;
      service_id: string;
      start_time: string;
      end_time: string;
      duration_ms: number;
      attributes: any;
      status: string;
    }) => apiClient.post('/telemetry/traces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traces'] });
      setSpanName('');
      addToast('Mock transaction span traces ingested successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to ingest trace span', 'error');
    }
  });

  // Ingest transaction pipeline of 3 nested spans
  const handleIngestTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestService) {
      addToast('Please select an active service first.', 'error');
      return;
    }
    if (!spanName.trim()) return;

    const traceId = Math.random().toString(16).substring(2, 18);
    const parentId = Math.random().toString(16).substring(2, 10);
    const dbSpanId = Math.random().toString(16).substring(2, 10);
    const cacheSpanId = Math.random().toString(16).substring(2, 10);

    const now = new Date();
    const duration = parseFloat(spanDuration);

    try {
      // Ingest parent span
      await ingestSpanMutation.mutateAsync({
        trace_id: traceId,
        span_id: parentId,
        name: spanName,
        service_id: ingestService,
        start_time: now.toISOString(),
        end_time: new Date(now.getTime() + duration).toISOString(),
        duration_ms: duration,
        attributes: { route: '/api/checkout', method: 'POST' },
        status: 'OK'
      });

      // Ingest child DB query span (taking 60% of duration)
      await ingestSpanMutation.mutateAsync({
        trace_id: traceId,
        span_id: dbSpanId,
        parent_span_id: parentId,
        name: 'SELECT * FROM users WHERE id = ?',
        service_id: ingestService,
        start_time: now.toISOString(),
        end_time: new Date(now.getTime() + duration * 0.6).toISOString(),
        duration_ms: duration * 0.6,
        attributes: { query: 'SELECT * FROM users' },
        status: 'OK'
      });

      // Ingest child redis cache check span
      await ingestSpanMutation.mutateAsync({
        trace_id: traceId,
        span_id: cacheSpanId,
        parent_span_id: parentId,
        name: 'redis:GET user_session',
        service_id: ingestService,
        start_time: new Date(now.getTime() + duration * 0.75).toISOString(),
        end_time: new Date(now.getTime() + duration * 0.95).toISOString(),
        duration_ms: duration * 0.2,
        attributes: { key: 'user_session' },
        status: 'OK'
      });
    } catch {
      // toast shown by mutate handlers
    }
  };

  // Group spans when rendering trace timelines
  const handleViewTraceTimeline = async (traceId: string) => {
    setSelectedTraceId(traceId);
    try {
      const res = await apiClient.get<SpanItem[]>(`/telemetry/traces?trace_id=${traceId}`);
      setSelectedTraceData(res);
    } catch (err: any) {
      addToast('Failed to load trace details', 'error');
    }
  };

  const getServiceSlug = (id: string) => {
    const s = services.find(srv => srv.id === id);
    return s ? s.name : 'Unknown';
  };

  const maxTraceDuration = selectedTraceData.length > 0
    ? Math.max(...selectedTraceData.map(s => s.duration_ms))
    : 1;

  return (
    <div className="traces-page-view animate-fade-in">
      <div className="traces-grid-layout">
        
        {/* Left column: Trigger and list */}
        <div className="traces-list-column">
          <Card variant="default">
            <Card.Header>
              <h3 className="traces-panel-heading">Trace Query Filter</h3>
            </Card.Header>
            <Card.Body className="traces-filter-body">
              <div className="filter-item-group">
                <label className="filter-label">Filter by Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="traces-select-control"
                >
                  <option value="all">All Services</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item-group">
                <label className="filter-label">Target Trace ID</label>
                <Input
                  placeholder="Paste OTel trace_id..."
                  value={selectedTraceId}
                  onChange={(e) => setSelectedTraceId(e.target.value)}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Trigger Transaction panel */}
          <Card variant="default" className="traces-trigger-card">
            <Card.Header>
              <h3 className="traces-panel-heading">Ingest Mock Trace</h3>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleIngestTrace} className="traces-ingest-form">
                <div className="filter-item-group">
                  <label className="filter-label">Service Source</label>
                  <select
                    value={ingestService}
                    onChange={(e) => setIngestService(e.target.value)}
                    className="traces-select-control"
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

                <Input
                  label="Root Transaction Operation"
                  placeholder="e.g. POST /api/v1/checkout"
                  value={spanName}
                  onChange={(e) => setSpanName(e.target.value)}
                  required
                />

                <Input
                  label="Duration (ms)"
                  type="number"
                  placeholder="e.g. 150"
                  value={spanDuration}
                  onChange={(e) => setSpanDuration(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={ingestSpanMutation.isPending}
                >
                  📡 Trigger Transaction Spans
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>

        {/* Right column: Trace list or Gantt chart */}
        <div className="traces-output-column">
          <Card variant="default" className="traces-console-card">
            <Card.Header
              action={
                selectedTraceId && (
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedTraceId(''); setSelectedTraceData([]); }}>
                    Clear Selection
                  </Button>
                )
              }
            >
              <h3 className="traces-panel-heading">
                {selectedTraceId ? `Trace Spans Gantt Chart: ${selectedTraceId.substring(0, 8)}...` : 'Observed Traces'}
              </h3>
            </Card.Header>
            <Card.Body className="traces-console-body">
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Skeleton shape="rect" width="100%" height={36} />
                  <Skeleton shape="rect" width="100%" height={36} />
                  <Skeleton shape="rect" width="100%" height={36} />
                </div>
              ) : error ? (
                <div style={{ color: 'var(--color-error-500)', padding: '24px 0', textAlign: 'center' }}>
                  ⚠️ Failed to load traces: {(error as any).message || 'Server connection error.'}
                </div>
              ) : selectedTraceId && selectedTraceData.length > 0 ? (
                /* gantt chart layout */
                <div className="trace-gantt-chart-container animate-fade-in">
                  {selectedTraceData.map((span) => {
                    const offsetPercentage = span.parent_span_id ? 15 : 0;
                    const durationPercentage = (span.duration_ms / maxTraceDuration) * 80;

                    return (
                      <div key={span.id} className="gantt-span-row">
                        <div className="gantt-span-details">
                          <span className="span-name-label font-mono">{span.name}</span>
                          <span className="span-meta-tag">{getServiceSlug(span.service_id)} • {span.duration_ms}ms</span>
                        </div>
                        <div className="gantt-span-timeline-bar-wrapper">
                          <div 
                            className={`gantt-span-bar ${span.status === 'ERROR' ? 'error' : ''}`}
                            style={{ 
                              marginLeft: `${offsetPercentage}%`,
                              width: `${Math.max(durationPercentage, 5)}%` 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !spans || spans.length === 0 ? (
                <EmptyState
                  title="No traces captured"
                  description="Click 'Trigger Transaction Spans' on the left to inject simulated nested span trace transactions."
                  icon="📡"
                />
              ) : (
                /* list of spans view */
                <div className="traces-list-view-table">
                  <div className="traces-list-header">
                    <span>Operation Name</span>
                    <span>Service</span>
                    <span>Trace ID</span>
                    <span>Duration</span>
                    <span>Status</span>
                  </div>
                  <div className="traces-list-body">
                    {spans.map((span) => (
                      <div 
                        key={span.id} 
                        className="traces-list-row animate-slide-up"
                        onClick={() => handleViewTraceTimeline(span.trace_id)}
                      >
                        <span className="span-name font-mono">{span.name}</span>
                        <span>{getServiceSlug(span.service_id)}</span>
                        <span className="font-mono text-secondary">{span.trace_id.substring(0, 8)}...</span>
                        <span className="font-mono font-weight-bold">{span.duration_ms}ms</span>
                        <span>
                          <Badge variant={span.status === 'OK' ? 'success' : 'error'} size="sm">
                            {span.status}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default TracesPage;
