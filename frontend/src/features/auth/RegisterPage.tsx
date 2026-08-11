import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/components/Toast/useToast';
import { useRegister, useLogin } from '@/hooks/api-hooks';
import { apiClient } from '@/lib/api-client';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import type { User } from '@/types/api';
import './RegisterPage.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useToast();
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  // Password strength checker
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: 'None', color: 'gray' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'var(--color-error-500)' };
    if (score <= 4) return { score, label: 'Moderate', color: 'var(--color-warning-500)' };
    return { score, label: 'Strong', color: 'var(--color-success-500)' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');

    try {
      // Step 1: Register the user
      await registerMutation.mutateAsync({
        email,
        full_name: fullName,
        password,
      });

      // Step 2: Auto-login after registration
      const tokenData = await loginMutation.mutateAsync({ email, password });
      localStorage.setItem('tracemind_access_token', tokenData.access_token);

      // Step 3: Fetch profile
      const user = await apiClient.get<User>('/auth/me');

      login(tokenData.access_token, tokenData.refresh_token, user);
      addToast('Account created successfully! Welcome to Tracemind.', 'success');
      navigate('/');
    } catch (err: any) {
      const message = err.message || 'Registration failed';
      setError(message);
      addToast('Failed to register', 'error');
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-background-shifter" />

      <Card variant="elevated" className="register-card animate-scale-in">
        <Card.Body>
          <div className="register-brand-header">
            <Hexagon className="brand-logo-hex" size={28} />
            <h2 className="brand-title">Tracemind</h2>
            <p className="brand-tagline">AI-Powered Engineering Observability</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form-element">
            {error && <div className="form-error-callout animate-shake">{error}</div>}

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            {password && (
              <div className="password-strength-indicator">
                <span className="strength-label">Strength: {strength.label}</span>
                <div className="strength-meter-bar-bg">
                  <div
                    className="strength-meter-bar-fill"
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                      backgroundColor: strength.color
                    }}
                  />
                </div>
              </div>
            )}

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-type your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              className="register-submit-btn"
            >
              Get Started
            </Button>
          </form>
        </Card.Body>

        <Card.Footer className="register-card-footer">
          <p className="login-redirect-text">
            Already have an account? <Link to="/login" className="login-link-anchor">Sign In</Link>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
};
export default RegisterPage;
