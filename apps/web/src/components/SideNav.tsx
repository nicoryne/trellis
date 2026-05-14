// apps/web/src/components/SideNav.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Network, PenLine, Users, MessageSquare } from 'lucide-react';

const CAPTURE_ITEMS = [
  { path: '/capture', label: 'Capture', Icon: PenLine },
  { path: '/graph', label: 'Personal Graph', Icon: Network },
];

const TEAM_ITEMS = [
  { path: '/team', label: 'Team Graph', Icon: Users },
  { path: '/chat', label: 'Chat', Icon: MessageSquare },
];

export function SideNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="side-nav">
      <div className="section-label">Personal</div>
      {CAPTURE_ITEMS.map(({ path, label, Icon }) => (
        <button
          key={path}
          className={`side-nav-item${pathname === path ? ' active' : ''}`}
          onClick={() => navigate(path)}
          aria-label={label}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}

      <div className="section-label">Team</div>
      {TEAM_ITEMS.map(({ path, label, Icon }) => (
        <button
          key={path}
          className={`side-nav-item${pathname === path ? ' active' : ''}`}
          onClick={() => navigate(path)}
          aria-label={label}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
    </aside>
  );
}
