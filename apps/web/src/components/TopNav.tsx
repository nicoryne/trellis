// apps/web/src/components/TopNav.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logoutRequest } from '../api/auth';
import './shell.css';

export function TopNav() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  async function handleLogout() {
    if (token) await logoutRequest(token);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <nav className="top-nav">
      <span className="top-nav-wordmark">Trellis</span>
      <div className="top-nav-right">
        {user && <span className="top-nav-user">{user.displayName}</span>}
        <button className="top-nav-logout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
