import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/Toast/ToastContext';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';

// Import feature pages
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ServiceListPage from '@/features/services/ServiceListPage';
import ServiceDetailPage from '@/features/services/ServiceDetailPage';
import ServiceCreatePage from '@/features/services/ServiceCreatePage';
import SettingsPage from '@/features/settings/SettingsPage';
import LogsPage from '@/features/logs/LogsPage';
import TracesPage from '@/features/traces/TracesPage';
import MetricsPage from '@/features/metrics/MetricsPage';
import IncidentsPage from '@/features/incidents/IncidentsPage';
import AIAssistantPage from '@/features/ai-assistant/AIAssistantPage';
import NotFoundPage from '@/features/not-found/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Workspace Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/services" element={<ServiceListPage />} />
                <Route path="/services/new" element={<ServiceCreatePage />} />
                <Route path="/services/:slug" element={<ServiceDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* New Ingest & Observability Routes */}
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/traces" element={<TracesPage />} />
                <Route path="/metrics" element={<MetricsPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
              </Route>
            </Route>

            {/* Error 404 Route */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};
export default App;
