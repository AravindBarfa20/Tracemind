import React, { useState, useRef, useEffect } from 'react';
import './SystemStatus.css';

interface StatusItem {
  name: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  latency?: string;
}

export const SystemStatus: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<StatusItem[]>([
    { name: 'API Server', status: 'unknown' },
    { name: 'Database', status: 'unknown' },
    { name: 'Redis Cache', status: 'unknown' },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const checkHealth = async () => {
    try {
      const start = performance.now();
      const res = await fetch('/api/v1/../health');
      const elapsed = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        setServices([
          { name: 'API Server', status: 'up', latency: `${elapsed}ms` },
          { name: 'Database', status: data.services?.database === 'up' ? 'up' : 'down', latency: data.services?.database === 'up' ? `${elapsed}ms` : undefined },
          { name: 'Redis Cache', status: data.services?.redis === 'up' ? 'up' : 'down' },
        ]);
      } else {
        setServices(prev => prev.map(s => ({ ...s, status: 'degraded' as const })));
      }
      setLastChecked(new Date());
    } catch {
      setServices(prev => prev.map(s => ({ ...s, status: s.name === 'API Server' ? 'down' as const : 'unknown' as const })));
      setLastChecked(new Date());
    }
  };

  // Check health on mount and every 30s
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const overallStatus = services.every(s => s.status === 'up')
    ? 'up'
    : services.some(s => s.status === 'down')
      ? 'down'
      : services.every(s => s.status === 'unknown')
        ? 'unknown'
        : 'degraded';

  const statusConfig: Record<string, { color: string; label: string; bgColor: string }> = {
    up: { color: 'var(--color-success-500)', label: 'Operational', bgColor: 'var(--color-success-50)' },
    down: { color: 'var(--color-error-500)', label: 'Down', bgColor: 'var(--color-error-50)' },
    degraded: { color: 'var(--color-warning-500)', label: 'Degraded', bgColor: 'var(--color-warning-50)' },
    unknown: { color: 'var(--color-neutral-400)', label: 'Checking…', bgColor: 'var(--color-neutral-100)' },
  };

  const overall = statusConfig[overallStatus];

  return (
    <div className="ss-wrapper" ref={panelRef}>
      <button
        className={`ss-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`System: ${overall.label}`}
      >
        <span
          className={`ss-dot ${overallStatus === 'up' ? 'pulse-healthy' : ''} ${overallStatus === 'down' ? 'pulse-critical' : ''}`}
          style={{ '--ss-color': overall.color } as React.CSSProperties}
        />
      </button>

      {isOpen && (
        <div className="ss-panel animate-slide-down-fade">
          <div className="ss-panel-header">
            <h3 className="ss-panel-title">System Status</h3>
            <span
              className="ss-overall-badge"
              style={{ background: overall.bgColor, color: overall.color }}
            >
              {overall.label}
            </span>
          </div>

          <div className="ss-service-list">
            {services.map(svc => {
              const cfg = statusConfig[svc.status];
              return (
                <div key={svc.name} className="ss-service-row">
                  <span
                    className="ss-service-dot"
                    style={{ background: cfg.color }}
                  />
                  <span className="ss-service-name">{svc.name}</span>
                  <span className="ss-service-status" style={{ color: cfg.color }}>{cfg.label}</span>
                  {svc.latency && (
                    <span className="ss-service-latency">{svc.latency}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ss-panel-footer">
            <span className="ss-last-checked">
              {lastChecked
                ? `Last checked ${lastChecked.toLocaleTimeString()}`
                : 'Checking…'}
            </span>
            <button className="ss-refresh-btn" onClick={checkHealth}>
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
