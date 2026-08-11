import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { 
  Server, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Calendar, 
  Plus, 
  Search, 
  Bot, 
  Radio, 
  Cpu, 
  Clock, 
  Monitor,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/components/Toast/useToast';
import { useServices } from '@/hooks/api-hooks';
import MetricCard from '@/components/MetricCard/MetricCard';
import Card from '@/components/Card/Card';
import Badge from '@/components/Badge/Badge';
import StatusDot from '@/components/StatusDot/StatusDot';
import Skeleton from '@/components/Skeleton/Skeleton';
import EmptyState from '@/components/EmptyState/EmptyState';
import './DashboardPage.css';

// Mock chart data for request volume (24 hours)
const requestVolumeData = [
  { time: '00:00', requests: 420 },
  { time: '02:00', requests: 310 },
  { time: '04:00', requests: 280 },
  { time: '06:00', requests: 480 },
  { time: '08:00', requests: 920 },
  { time: '10:00', requests: 1450 },
  { time: '12:00', requests: 1680 },
  { time: '14:00', requests: 1520 },
  { time: '16:00', requests: 1850 },
  { time: '18:00', requests: 1610 },
  { time: '20:00', requests: 1100 },
  { time: '22:00', requests: 650 },
];

// Mock activity events
const mockEvents = [
  { id: '1', type: 'deploy', title: 'User Service deployed', desc: 'Version v1.4.2 released to production', time: '12 mins ago', status: 'success' },
  { id: '2', type: 'alert', title: 'Active Alert: High Latency warning', desc: 'Billing Transactions response time > 300ms', time: '24 mins ago', status: 'warning' },
  { id: '3', type: 'health', title: 'Catalog Search Sync failed', desc: 'Health check ping returned status code 503 Service Unavailable', time: '1 hour ago', status: 'danger' },
  { id: '4', type: 'config', title: 'Redis Cache config updated', desc: 'maxmemory-policy set to volatile-lru by Admin', time: '3 hours ago', status: 'info' },
  { id: '5', type: 'deploy', title: 'Analytics Worker deployed', desc: 'Version staging-v2.1.0-alpha', time: '5 hours ago', status: 'success' },
  { id: '6', type: 'alert', title: 'Alert resolved: Host CPU spike', desc: 'Host node k8s-node-p3 resolved', time: '8 hours ago', status: 'success' },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();

  // Load real services from backend via TanStack Query
  const { data: servicesData, isLoading, error } = useServices({ page_size: 6 });

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const totalServicesCount = servicesData?.total ?? 0;

  const renderServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'api':
        return <span className="service-type-badge-emoji"><Radio size={14} /> API</span>;
      case 'worker':
        return <span className="service-type-badge-emoji"><Cpu size={14} /> Worker</span>;
      case 'cron':
        return <span className="service-type-badge-emoji"><Clock size={14} /> Cron</span>;
      default:
        return <span className="service-type-badge-emoji"><Monitor size={14} /> Frontend</span>;
    }
  };

  return (
    <div className="dashboard-view-container animate-fade-in">
      {/* Welcome Greeting Banner */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-left">
          <h2 className="welcome-banner-greeting">
            {getGreeting()}, <span className="highlight-gradient-text">{user?.full_name.split(' ')[0] || 'Engineer'}</span>
          </h2>
          <p className="welcome-banner-subtitle">Here is what is happening across your systems today.</p>
        </div>
        <div className="welcome-banner-right">
          <span className="banner-date-badge"><Calendar size={14} style={{ marginRight: '6px' }} /> {todayStr}</span>
        </div>
      </div>

      {/* KPI Stats metrics row */}
      <div className="dashboard-kpis-grid">
        <MetricCard
          title="Total Monitored Services"
          value={isLoading ? '...' : totalServicesCount.toString()}
          trend={{ value: 'Real-time count', isPositive: true }}
          color="teal"
          icon={<Server size={20} />}
          sparklineData={[10, 10, 11, 11, 11, 12, totalServicesCount > 0 ? totalServicesCount : 12]}
        />
        <MetricCard
          title="Active System Incidents"
          value="3"
          trend={{ value: '+1 triggered recently', isPositive: false }}
          color="coral"
          icon={<AlertTriangle size={20} />}
          sparklineData={[1, 2, 2, 4, 3, 2, 3]}
        />
        <MetricCard
          title="Average Latency (P95)"
          value="142ms"
          trend={{ value: '-8.5% improvement', isPositive: true }}
          color="blue"
          icon={<Zap size={20} />}
          sparklineData={[162, 154, 150, 145, 140, 145, 142]}
        />
        <MetricCard
          title="Global System Uptime"
          value="99.94%"
          trend={{ value: '0.02% variance', isPositive: true }}
          color="green"
          icon={<ShieldCheck size={20} />}
          sparklineData={[99.91, 99.92, 99.91, 99.93, 99.94, 99.92, 99.94]}
        />
      </div>

      {/* Dashboard Main layout splits */}
      <div className="dashboard-grid-layout">
        
        {/* Left Side splits */}
        <div className="dashboard-layout-left">
          
          {/* Section: Overview Chart */}
          <Card variant="default" className="dashboard-panel-card">
            <Card.Header 
              action={
                <div className="chart-actions-mock">
                  <Badge variant="default" size="sm">Live</Badge>
                </div>
              }
            >
              <h3 className="panel-card-title">System Request Volume (24h)</h3>
            </Card.Header>
            <Card.Body>
              <div className="chart-container-wrapper" style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={requestVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-surface-overlay)', 
                        borderColor: 'var(--color-border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)'
                      }} 
                    />
                    <Area type="monotone" dataKey="requests" stroke="var(--color-primary-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          {/* Section: Services Health */}
          <div className="dashboard-services-section">
            <div className="section-heading-bar">
              <h3 className="section-heading-title">Service Registries Health</h3>
              <Link to="/services" className="section-header-link-anchor">View all registries →</Link>
            </div>
            
            {isLoading ? (
              <div className="services-health-grid">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Card key={idx} variant="default" className="service-health-card skeleton-card-override">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <Skeleton shape="text" width="60%" height={16} />
                      <Skeleton shape="text" width="30%" height={12} />
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <Skeleton shape="rect" width="30%" height={24} />
                        <Skeleton shape="rect" width="30%" height={24} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card variant="default">
                <Card.Body>
                  <div style={{ color: 'var(--color-error-500)', textAlign: 'center', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> Failed to load service registry: {(error as any).message || 'Server connection error'}
                  </div>
                </Card.Body>
              </Card>
            ) : !servicesData?.items || servicesData.items.length === 0 ? (
              <EmptyState
                title="No services registered yet"
                description="Monitor your APIs, workers, cron jobs and frontend components."
                actionLabel="Register Service"
                onAction={() => navigate('/services/new')}
              />
            ) : (
              <div className="services-health-grid">
                {servicesData.items.map((service) => (
                  <Card 
                    key={service.id} 
                    variant="default" 
                    hover 
                    onClick={() => navigate(`/services/${service.slug}`)}
                    className="service-health-card animate-scale-in"
                  >
                    <div className="service-card-top">
                      <div className="service-name-and-type">
                        <h4 className="service-title-text">{service.name}</h4>
                        {renderServiceTypeBadge(service.service_type)}
                      </div>
                      <StatusDot status={service.status === 'active' ? 'healthy' : 'unknown'} label={service.status === 'active' ? 'Active' : 'Inactive'} />
                    </div>
                    
                    <div className="service-card-meta-metrics">
                      <div className="meta-metric-item">
                        <span className="meta-metric-label">Environment</span>
                        <span className="meta-metric-value" style={{ textTransform: 'capitalize' }}>{service.environment}</span>
                      </div>
                      <div className="meta-metric-item">
                        <span className="meta-metric-label">Team</span>
                        <span className="meta-metric-value truncate">{service.team || 'Unassigned'}</span>
                      </div>
                      <div className="meta-metric-item">
                        <span className="meta-metric-label">Status</span>
                        <span className="meta-metric-value truncate" style={{ color: service.status === 'active' ? 'var(--color-success-600)' : 'var(--color-text-secondary)' }}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side splits */}
        <div className="dashboard-layout-right">
          
          {/* Quick Actions */}
          <Card variant="default" className="dashboard-panel-card quick-actions-panel">
            <Card.Header>
              <h3 className="panel-card-title">Quick Actions</h3>
            </Card.Header>
            <Card.Body className="quick-actions-body">
              <button className="quick-action-btn-card teal" onClick={() => navigate('/services/new')}>
                <span className="btn-card-icon"><Plus size={18} /></span>
                <div className="btn-card-details">
                  <span className="btn-card-label">Register Service</span>
                  <span className="btn-card-sublabel">Add monitored component</span>
                </div>
              </button>
              
              <button className="quick-action-btn-card blue" onClick={() => addToast('Distributed tracing viewer active in Traces menu', 'info')}>
                <span className="btn-card-icon"><Search size={18} /></span>
                <div className="btn-card-details">
                  <span className="btn-card-label">Investigate Traces</span>
                  <span className="btn-card-sublabel">Browse transactions flow</span>
                </div>
              </button>

              <button className="quick-action-btn-card coral" onClick={() => navigate('/ai-assistant')}>
                <span className="btn-card-icon"><Bot size={18} /></span>
                <div className="btn-card-details">
                  <span className="btn-card-label">Run AI Diagnostic</span>
                  <span className="btn-card-sublabel">Search incident patterns</span>
                </div>
              </button>
            </Card.Body>
          </Card>

          {/* Section: Activity Feed */}
          <Card variant="default" className="dashboard-panel-card activity-feed-panel">
            <Card.Header>
              <h3 className="panel-card-title">Recent System Activity</h3>
            </Card.Header>
            <Card.Body>
              <div className="vertical-activity-timeline">
                {mockEvents.map((evt) => (
                  <div key={evt.id} className="timeline-event-item">
                    <div className="timeline-badge-column">
                      <span className={`timeline-indicator-dot ${evt.status}`} />
                      <div className="timeline-connector-line" />
                    </div>
                    <div className="timeline-event-details">
                      <div className="event-title-row">
                        <h4 className="event-title-text">{evt.title}</h4>
                        <span className="event-time-text">{evt.time}</span>
                      </div>
                      <p className="event-desc-text">{evt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

        </div>

      </div>
    </div>
  );
};
export default DashboardPage;
