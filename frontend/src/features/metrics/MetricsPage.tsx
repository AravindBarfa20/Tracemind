import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useServices } from '@/hooks/api-hooks';
import Card from '@/components/Card/Card';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Skeleton from '@/components/Skeleton/Skeleton';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useToast } from '@/components/Toast/useToast';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line, CartesianGrid } from 'recharts';
import './MetricsPage.css';

interface MetricItem {
  id: string;
  service_id: string;
  name: string;
  value: number;
  timestamp: string;
  labels: Record<string, any>;
}

export const MetricsPage: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState('');
  const [timeRange, setTimeRange] = useState('1h');

  // Form states to ingest mock metrics
  const [metricNameInput, setMetricNameInput] = useState('cpu_utilization');
  const [metricValueInput, setMetricValueInput] = useState('45.2');

  // Load services list
  const { data: servicesData } = useServices();
  const services = servicesData?.items || [];

  // Automatically select first service
  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0].id);
    }
  }, [services, selectedService]);

  // Query CPU utilization metric summary
  const { data: cpuMetrics, isLoading: isCpuLoading } = useQuery<MetricItem[]>({
    queryKey: ['metrics', selectedService, 'cpu_utilization', timeRange],
    queryFn: () => apiClient.get(`/telemetry/metrics/summary?service_id=${selectedService}&metric_name=cpu_utilization`),
    enabled: !!selectedService,
    refetchInterval: 10000,
  });

  // Query Memory utilization metric summary
  const { data: memMetrics, isLoading: isMemLoading } = useQuery<MetricItem[]>({
    queryKey: ['metrics', selectedService, 'memory_utilization', timeRange],
    queryFn: () => apiClient.get(`/telemetry/metrics/summary?service_id=${selectedService}&metric_name=memory_utilization`),
    enabled: !!selectedService,
    refetchInterval: 10000,
  });

  // Mutation to ingest mock metric values
  const ingestMetricMutation = useMutation({
    mutationFn: (data: { service_id: string; name: string; value: number; labels: any }) =>
      apiClient.post('/telemetry/metrics', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      addToast('Mock metric data point saved to DB!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to save metric', 'error');
    }
  });

  const handleIngestMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    if (!metricValueInput) return;

    ingestMetricMutation.mutate({
      service_id: selectedService,
      name: metricNameInput,
      value: parseFloat(metricValueInput),
      labels: { host: 'k8s-pod-z3', environment: 'production' }
    });
  };

  // Setup sample series datagrid for charts
  const formatChartData = (data: MetricItem[] | undefined) => {
    if (!data) return [];
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: item.value
    }));
  };

  const cpuChartData = formatChartData(cpuMetrics);
  const memChartData = formatChartData(memMetrics);

  const hasData = cpuChartData.length > 0 || memChartData.length > 0;

  return (
    <div className="metrics-page-view animate-fade-in">
      <div className="metrics-top-controls">
        <div className="filter-dropdown-select-group">
          <span className="dropdown-label">Target Service</span>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="metrics-select-control"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            {services.length === 0 && (
              <option value="">No services registered</option>
            )}
          </select>
        </div>

        <div className="time-range-buttons">
          {['1h', '6h', '24h'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="metrics-layout-grid">
        {/* Left Side: Time-series lines charts */}
        <div className="metrics-charts-column">
          {isCpuLoading || isMemLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton shape="rect" width="100%" height={260} />
              <Skeleton shape="rect" width="100%" height={260} />
            </div>
          ) : !hasData ? (
            <EmptyState
              title="No metrics captured yet"
              description="Inject simulated metric data points using the panel on the right to view real-time time-series lines."
              icon="📈"
            />
          ) : (
            <div className="metrics-panels-list">
              {/* CPU Chart */}
              <Card variant="default">
                <Card.Header>
                  <h3 className="metrics-panel-heading">CPU Utilization (%)</h3>
                </Card.Header>
                <Card.Body>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cpuChartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="time" stroke="var(--color-text-secondary)" fontSize={11} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="var(--color-primary-500)" strokeWidth={2} dot={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>

              {/* Memory Chart */}
              <Card variant="default">
                <Card.Header>
                  <h3 className="metrics-panel-heading">Memory Utilization (MB)</h3>
                </Card.Header>
                <Card.Body>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={memChartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="time" stroke="var(--color-text-secondary)" fontSize={11} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="var(--color-accent-500)" strokeWidth={2} dot={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>

        {/* Right Side: Simulation Panel */}
        <div className="metrics-simulation-column">
          <Card variant="default">
            <Card.Header>
              <h3 className="metrics-panel-heading">Ingest Mock Metric</h3>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleIngestMetric} className="metrics-ingest-form">
                <div className="filter-item-group">
                  <label className="filter-label">Metric Key</label>
                  <select
                    value={metricNameInput}
                    onChange={(e) => setMetricNameInput(e.target.value)}
                    className="metrics-select-control"
                  >
                    <option value="cpu_utilization">cpu_utilization (%)</option>
                    <option value="memory_utilization">memory_utilization (MB)</option>
                  </select>
                </div>

                <Input
                  label="Metric Value"
                  placeholder="e.g. 78.4"
                  type="number"
                  value={metricValueInput}
                  onChange={(e) => setMetricValueInput(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={ingestMetricMutation.isPending}
                >
                  📈 Ingest Metric Point
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default MetricsPage;
