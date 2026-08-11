import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Table, { type Column } from '@/components/Table/Table';
import Badge from '@/components/Badge/Badge';
import Card from '@/components/Card/Card';
import StatusDot from '@/components/StatusDot/StatusDot';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Skeleton from '@/components/Skeleton/Skeleton';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useServices } from '@/hooks/api-hooks';
import type { Service } from '@/types/api';
import './ServiceListPage.css';

export const ServiceListPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const apiParams = {
    search: debouncedSearch || undefined,
    environment: envFilter !== 'all' ? envFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data: servicesData, isLoading, error } = useServices(apiParams);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const services = servicesData?.items || [];

  const columns: Column<Service>[] = [
    {
      key: 'name',
      header: 'Service Name',
      sortable: true,
      render: (row) => (
        <div className="table-service-name-cell">
          <span className="service-cell-icon">
            {row.service_type === 'api' ? '📡' : row.service_type === 'worker' ? '⚙️' : row.service_type === 'cron' ? '⏱️' : '💻'}
          </span>
          <div className="service-cell-details">
            <span className="service-cell-name">{row.name}</span>
            <span className="service-cell-desc truncate">{row.description || 'No description provided.'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'service_type',
      header: 'Type',
      sortable: true,
      render: (row) => (
        <Badge variant="default" size="sm" className="text-uppercase font-mono">
          {row.service_type}
        </Badge>
      )
    },
    {
      key: 'environment',
      header: 'Environment',
      sortable: true,
      render: (row) => {
        const variant = 
          row.environment === 'production' ? 'success' :
          row.environment === 'staging' ? 'warning' : 'info';
        return (
          <Badge variant={variant} size="sm" className="text-capitalize">
            {row.environment}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const dotStatus = row.status === 'active' ? 'healthy' : 'down';
        return <StatusDot status={dotStatus} label={row.status} size="sm" />;
      }
    },
    {
      key: 'team',
      header: 'Owner Team',
      sortable: true,
      render: (row) => <span>{row.team || 'Unassigned'}</span>
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      sortable: true,
      render: (row) => {
        const formatted = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(row.updated_at));
        return <span className="table-time-cell">{formatted}</span>;
      }
    }
  ];

  return (
    <div className="services-list-view animate-fade-in">
      {/* Top action header */}
      <div className="view-title-action-header">
        <div className="header-info-group">
          <h2 className="view-title">Service Registries</h2>
          <p className="view-subtitle">Monitor and catalog registered backend modules, crons, and API services.</p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/services/new')}>
          ➕ Register Service
        </Button>
      </div>

      {/* Filter and Query controls */}
      <div className="filter-controls-card">
        <Input
          placeholder="Search services, teams, descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
          className="search-filter-input"
        />

        <div className="dropdowns-filter-group">
          <div className="filter-dropdown-select-group">
            <span className="dropdown-label">Environment</span>
            <select 
              value={envFilter} 
              onChange={(e) => setEnvFilter(e.target.value)} 
              className="filter-select-element"
            >
              <option value="all">All Environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="filter-dropdown-select-group">
            <span className="dropdown-label">Status</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="filter-select-element"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Table / Skeletons */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
          <Skeleton shape="rect" width="100%" height={40} />
          <Skeleton shape="rect" width="100%" height={40} />
          <Skeleton shape="rect" width="100%" height={40} />
          <Skeleton shape="rect" width="100%" height={40} />
        </div>
      ) : error ? (
        <Card variant="default">
          <Card.Body>
            <div style={{ color: 'var(--color-error-500)', textAlign: 'center', padding: '24px 0' }}>
              ⚠️ Failed to load service registry: {(error as any).message || 'Server connection error'}
            </div>
          </Card.Body>
        </Card>
      ) : services.length === 0 ? (
        <EmptyState
          title={search || envFilter !== 'all' || statusFilter !== 'all' ? "No matching services found" : "No services registered yet"}
          description={search || envFilter !== 'all' || statusFilter !== 'all' ? "Try adjusting your search query or filter tags." : "Register your first service to begin monitoring system telemetry."}
          actionLabel={search || envFilter !== 'all' || statusFilter !== 'all' ? "Clear Filters" : "Register Service"}
          onAction={() => {
            if (search || envFilter !== 'all' || statusFilter !== 'all') {
              setSearch('');
              setEnvFilter('all');
              setStatusFilter('all');
            } else {
              navigate('/services/new');
            }
          }}
        />
      ) : (
        <Table
          columns={columns}
          data={services}
          onRowClick={(row) => navigate(`/services/${row.slug}`)}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}
    </div>
  );
};
export default ServiceListPage;
