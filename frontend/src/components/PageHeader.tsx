import type { ReactNode } from 'react';

export const PageHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) => (
  <header className="page-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
    </div>
    {children ? <div className="page-actions">{children}</div> : null}
  </header>
);
