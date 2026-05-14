// apps/web/src/components/SideNav.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Network, PenLine, Users, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

const CAPTURE_ITEMS = [
  { path: '/capture', label: 'Capture', Icon: PenLine },
  { path: '/graph', label: 'Personal Graph', Icon: Network },
];

const TEAM_ITEMS = [
  { path: '/team', label: 'Team Graph', Icon: Users },
  { path: '/chat', label: 'Chat', Icon: MessageSquare },
];

interface NavItemProps {
  path: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  active: boolean;
  onClick: () => void;
}

function NavItem({ path: _path, label, Icon, active, onClick }: NavItemProps) {
  return (
    <button
      className={`side-nav-item${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {active && (
        <motion.span
          layoutId="side-nav-rail"
          className="side-nav-rail"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <Icon size={18} aria-hidden />
      <span className="side-nav-label">{label}</span>
    </button>
  );
}

export function SideNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="side-nav">
      <div className="section-label">Personal</div>
      {CAPTURE_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          {...item}
          active={pathname === item.path}
          onClick={() => navigate(item.path)}
        />
      ))}

      <div className="section-label">Team</div>
      {TEAM_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          {...item}
          active={pathname === item.path}
          onClick={() => navigate(item.path)}
        />
      ))}
    </aside>
  );
}
