import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/components/Toast/useToast';
import { useLogin } from '@/hooks/api-hooks';
import { apiClient } from '@/lib/api-client';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import type { User } from '@/types/api';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useToast();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');

    try {
      // Call real backend API
      const tokenData = await loginMutation.mutateAsync({ email, password });

      // Store token first so subsequent requests are authenticated
      localStorage.setItem('tracemind_access_token', tokenData.access_token);

      // Fetch the user profile
      const user = await apiClient.get<User>('/auth/me');

      login(tokenData.access_token, tokenData.refresh_token, user);
      addToast('Welcome back to Tracemind!', 'success');
      navigate('/');
    } catch (err: any) {
      const message = err.message || 'Authentication failed. Check your credentials.';
      setError(message);
      addToast('Failed to log in', 'error');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-background-shifter" />

      <Card variant="elevated" className="login-card animate-scale-in">
        <Card.Body>
          <div className="login-brand-header">
            <Hexagon className="brand-logo-hex" size={28} />
            <h2 className="brand-title">Tracemind</h2>
            <p className="brand-tagline">AI-Powered Engineering Observability</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-element">
            {error && <div className="form-error-callout animate-shake">{error}</div>}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginMutation.isPending}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />

            <div className="login-action-bar">
              <span className="forgot-pass-link-mock">Forgot password?</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </form>
        </Card.Body>

        <Card.Footer className="login-card-footer">
          <p className="register-redirect-text">
            New to Tracemind? <Link to="/register" className="register-link-anchor">Create an account</Link>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
};
export default LoginPage;
