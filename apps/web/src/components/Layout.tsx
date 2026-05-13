// apps/web/src/components/Layout.tsx
import React from 'react';
import { TopNav } from './TopNav';
import { SideNav } from './SideNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <TopNav />
      <div className="app-body">
        <SideNav />
        <main className="content-area">{children}</main>
      </div>
    </>
  );
}
