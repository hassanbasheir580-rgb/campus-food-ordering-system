import type { LucideIcon } from 'lucide-react';

export const StatCard = ({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail?: string; icon: LucideIcon }) => (
  <article className="stat-card">
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
    <div className="stat-icon">
      <Icon size={22} aria-hidden="true" />
    </div>
  </article>
);
