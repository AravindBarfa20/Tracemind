import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useServices } from '@/hooks/api-hooks';
import Card from '@/components/Card/Card';
import Button from '@/components/Button/Button';
import Badge from '@/components/Badge/Badge';
import Skeleton from '@/components/Skeleton/Skeleton';
import { useToast } from '@/components/Toast/useToast';
import './AIAssistantPage.css';

interface AIHypothesis {
  title: string;
  description: string;
  confidence_score: number;
  suggested_fix: string;
}

interface DiagnoseResponse {
  service_id: string;
  incident_id: string | null;
  diagnostic_summary: string;
  hypotheses: AIHypothesis[];
  latency_ms: number;
}

export const AIAssistantPage: React.FC = () => {
  const { addToast } = useToast();
  const [selectedService, setSelectedService] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnoseResponse | null>(null);

  // Load services list
  const { data: servicesData } = useServices();
  const services = servicesData?.items || [];

  // Automatically select first service
  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0].id);
    }
  }, [services, selectedService]);

  // Mutation to request AI diagnosis
  const diagnoseMutation = useMutation({
    mutationFn: (data: { service_id: string; custom_query?: string }) =>
      apiClient.post<DiagnoseResponse>('/investigation/diagnose', data),
    onSuccess: (res) => {
      setDiagnosis(res);
      addToast('AI diagnostics finished!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'AI diagnostic generation failed', 'error');
    }
  });

  const handleDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    diagnoseMutation.mutate({
      service_id: selectedService,
      custom_query: customPrompt || undefined
    });
  };

  return (
    <div className="ai-assistant-view animate-fade-in">
      <div className="ai-assistant-grid">
        
        {/* Left Column: Diagnostics Request Options */}
        <div className="ai-input-column">
          <Card variant="default">
            <Card.Header>
              <h3 className="ai-panel-heading">AI Debugger Settings</h3>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleDiagnose} className="ai-diagnose-form">
                <div className="filter-item-group">
                  <label className="filter-label">Service to Diagnose</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="ai-select-control"
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

                <div className="input-field-group">
                  <label className="input-label">Anomaly Symptoms / Query Context (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="e.g. CPU spikes every time client uploads files. Investigate connection pools."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="form-textarea-control"
                    disabled={diagnoseMutation.isPending}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={diagnoseMutation.isPending}
                >
                  🤖 Run Root-Cause Diagnosis
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>

        {/* Right Column: AI Hypotheses and Fix Suggestions */}
        <div className="ai-results-column">
          {diagnoseMutation.isPending ? (
            <Card variant="default">
              <Card.Body className="ai-loading-state">
                <span className="ai-pulse-icon">🤖</span>
                <h4 style={{ margin: '16px 0 8px 0' }}>AI Investigator is analyzing telemetry...</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: 0 }}>
                  Querying recent logs, correlating span traces durations, and running inference model.
                </p>
                <div style={{ width: '100%', marginTop: '24px' }}>
                  <Skeleton shape="text" count={3} />
                </div>
              </Card.Body>
            </Card>
          ) : diagnosis ? (
            <div className="ai-results-panels-list animate-fade-in">
              {/* Summary Card */}
              <Card variant="default" className="ai-summary-card">
                <Card.Header
                  action={
                    <Badge variant="success" size="sm">
                      Inference Latency: {diagnosis.latency_ms}ms
                    </Badge>
                  }
                >
                  <h3 className="ai-panel-heading">Diagnostic Analysis Overview</h3>
                </Card.Header>
                <Card.Body>
                  <p className="ai-summary-text">{diagnosis.diagnostic_summary}</p>
                </Card.Body>
              </Card>

              {/* Hypotheses List */}
              <div className="ai-hypotheses-list-header">
                <h4>Potential Root Causes & Code Recommendations</h4>
              </div>

              {diagnosis.hypotheses.map((hyp, index) => (
                <Card key={index} variant="default" className="ai-hypothesis-card animate-scale-in">
                  <div className="hypothesis-header-row">
                    <h4 className="hypothesis-title">{hyp.title}</h4>
                    <Badge variant={hyp.confidence_score >= 0.7 ? 'success' : 'warning'} size="sm">
                      {Math.round(hyp.confidence_score * 100)}% Confidence
                    </Badge>
                  </div>

                  <p className="hypothesis-desc">{hyp.description}</p>

                  <div className="hypothesis-code-fix-block">
                    <span className="code-fix-label">Recommended Resolve Fix:</span>
                    <pre className="code-fix-pre">
                      {hyp.suggested_fix}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="default" className="ai-empty-panel">
              <Card.Body>
                <div className="ai-empty-content">
                  <span className="ai-empty-icon">🤖</span>
                  <h4>AI Diagnostic Console</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '8px 0 0 0', maxWidth: '380px' }}>
                    Select an observed service component on the left, add context details, and trigger AI analysis to debug system anomalies.
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};
export default AIAssistantPage;
