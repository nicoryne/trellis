// apps/web/src/views/auth/LoginView.tsx
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { seedPersonalNotes } from '../../lib/seedPersonal';
import './login.css';

export function LoginView() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await loginRequest(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.data) {
      login(result.data.token, result.data.user);

      // Seed personal notes for the Lawyer demo account on first login (PRD §2.8)
      // seedPersonalNotes() is idempotent — skips if notes already exist
      if (result.data.user.role === 'lawyer') {
        seedPersonalNotes().catch(console.error);
      }

      navigate('/capture', { replace: true });
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <span className="login-wordmark">Trellis</span>
        <h1 className="login-title">Sign in to Trellis</h1>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`login-input${error ? ' error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`login-input${error ? ' error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
