import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button/Button';
import './NotFoundPage.css';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content-card animate-scale-in">
        <span className="not-found-icon animate-float">🛸</span>
        <h2 className="not-found-error-code">404</h2>
        <h3 className="not-found-heading">Page Not Found</h3>
        <p className="not-found-desc">
          The requested dashboard, trace details, or services link seems to have drifted into outer space.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
export default NotFoundPage;
