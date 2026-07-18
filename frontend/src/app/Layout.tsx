import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import './Layout.css';

export const Layout: React.FC = () => {
  const location = useLocation();
  
  // Derive page title and breadcrumbs dynamically from current pathname
  const getHeaderDetails = () => {
    const path = location.pathname;
    
    if (path === '/') {
      return { title: 'Dashboard', crumbs: ['Tracemind'] };
    }
    if (path === '/services') {
      return { title: 'Services Registry', crumbs: ['Tracemind', 'Services'] };
    }
    if (path === '/services/new') {
      return { title: 'Register New Service', crumbs: ['Tracemind', 'Services', 'Register'] };
    }
    if (path.startsWith('/services/')) {
      const parts = path.split('/');
      const slug = parts[parts.length - 1];
      return { title: `Service: ${slug}`, crumbs: ['Tracemind', 'Services', slug] };
    }
    if (path === '/settings') {
      return { title: 'Platform Settings', crumbs: ['Tracemind', 'Settings'] };
    }
    if (path === '/traces') {
      return { title: 'Distributed Tracing', crumbs: ['Tracemind', 'Observability', 'Traces'] };
    }
    if (path === '/logs') {
      return { title: 'Structured Log Search', crumbs: ['Tracemind', 'Observability', 'Logs'] };
    }
    if (path === '/metrics') {
      return { title: 'System Metrics Summary', crumbs: ['Tracemind', 'Observability', 'Metrics'] };
    }
    if (path === '/incidents') {
      return { title: 'Incident Alerts Triage', crumbs: ['Tracemind', 'Operations', 'Incidents'] };
    }
    if (path === '/ai-assistant') {
      return { title: 'AI Diagnostics Investigator', crumbs: ['Tracemind', 'Operations', 'AI Assistant'] };
    }
    
    return { title: 'Observability', crumbs: ['Tracemind'] };
  };

  const { title, crumbs } = getHeaderDetails();

  return (
    <div className="app-layout-frame">
      <Sidebar />
      
      {/* Content wrapper adjusts spacing relative to sidebar width */}
      <div className="app-content-wrapper">
        <Header title={title} breadcrumbs={crumbs} />
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
