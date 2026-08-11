import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast/useToast';
import { useCreateService } from '@/hooks/api-hooks';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import Card from '@/components/Card/Card';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import './ServiceCreatePage.css';

export const ServiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const createServiceMutation = useCreateService();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('api');
  const [environment, setEnvironment] = useState('production');
  const [baseUrl, setBaseUrl] = useState('');
  const [healthEndpoint, setHealthEndpoint] = useState('');
  const [team, setTeam] = useState('');
  const [tags, setTags] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setFormError('Service name is required');
      return;
    }

    setFormError('');

    try {
      const parsedTags = tags
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await createServiceMutation.mutateAsync({
        name,
        description: description || undefined,
        service_type: type,
        environment,
        base_url: baseUrl || undefined,
        health_endpoint: healthEndpoint || undefined,
        team: team || undefined,
        tags: parsedTags,
      });
      
      addToast(`Service '${name}' registered successfully!`, 'success');
      navigate('/services');
    } catch (err: any) {
      setFormError(err.message || 'Failed to register service');
      addToast('Registration failed', 'error');
    }
  };

  const breadcrumbs = [
    { label: 'Services', path: '/services' },
    { label: 'Register Service' }
  ];

  const isLoading = createServiceMutation.isPending;

  return (
    <div className="service-create-view animate-fade-in">
      <Breadcrumbs items={breadcrumbs} className="create-view-breadcrumbs" />
      
      <div className="create-view-header">
        <h2 className="view-title">Register New Service</h2>
        <p className="view-subtitle">Enter details to add a new microservice under observation in your registry.</p>
      </div>

      <Card variant="default" className="create-form-card">
        <Card.Body>
          <form onSubmit={handleSubmit} className="service-create-form">
            {formError && <div className="form-error-callout animate-shake">{formError}</div>}

            <div className="form-two-column-grid">
              <div className="form-col-left">
                <Input
                  label="Service Name *"
                  type="text"
                  placeholder="e.g. User Authentication Service"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <div className="input-field-group">
                  <label className="input-label">Description / Purpose</label>
                  <textarea
                    rows={4}
                    placeholder="Describe what this microservice handles..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    className="form-textarea-control"
                  />
                </div>

                <div className="form-inline-fields-row">
                  <div className="input-field-group flex-1">
                    <label className="input-label">Service Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      disabled={isLoading}
                      className="form-select-control"
                    >
                      <option value="api">API Endpoint</option>
                      <option value="worker">Queue Worker</option>
                      <option value="cron">Cron Job</option>
                      <option value="frontend">Frontend Client</option>
                    </select>
                  </div>

                  <div className="input-field-group flex-1">
                    <label className="input-label">Deployment Environment</label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      disabled={isLoading}
                      className="form-select-control"
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-col-right">
                <Input
                  label="Base URL (Optional)"
                  type="url"
                  placeholder="e.g. https://auth.production.tracemind.internal"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Health Check Endpoint (Optional)"
                  type="url"
                  placeholder="e.g. https://auth.production.tracemind.internal/healthz"
                  value={healthEndpoint}
                  onChange={(e) => setHealthEndpoint(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Owner Team / Squad"
                  type="text"
                  placeholder="e.g. Core Security, Billing Squad"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Tags (Comma separated)"
                  type="text"
                  placeholder="e.g. auth, core, security"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-action-buttons-row">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/services')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
              >
                Register Service
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};
export default ServiceCreatePage;
