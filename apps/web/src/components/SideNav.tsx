// apps/web/src/components/SideNav.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Network, PenLine, Users, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
  collapsed: boolean;
  onClick: () => void;
}

function NavItem({ path: _path, label, Icon, active, collapsed, onClick }: NavItemProps) {
  return (
    <button
      className={`side-nav-item${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
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

interface SideNavProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onMobileClose: () => void;
}

export function SideNav({ collapsed, mobileOpen, onToggleCollapsed, onMobileClose }: SideNavProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleNav(path: string) {
    navigate(path);
    onMobileClose();
  }

  const cls = [
    'side-nav',
    collapsed ? 'side-nav--collapsed' : '',
    mobileOpen ? 'side-nav--mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={cls}>
      <div className="section-label">Personal</div>
      {CAPTURE_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          {...item}
          collapsed={collapsed}
          active={pathname === item.path}
          onClick={() => handleNav(item.path)}
        />
      ))}

      <div className="side-nav-divider" />
      <div className="section-label">Team</div>
      {TEAM_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          {...item}
          collapsed={collapsed}
          active={pathname === item.path}
          onClick={() => handleNav(item.path)}
        />
      ))}

      <div className="side-nav-footer">
        <button
          className="side-nav-toggle"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={16} aria-hidden />
            : <ChevronLeft size={16} aria-hidden />}
        </button>
      </div>
    </aside>
  );
}
