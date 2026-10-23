import type { ReactNode } from 'react';
import { PublicHeader, PublicFooter } from './PublicLayout';

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
