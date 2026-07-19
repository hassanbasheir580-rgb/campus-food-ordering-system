import type { LucideIcon } from 'lucide-react';

export const EmptyState = ({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message: string }) => (
  <div className="empty-state">
    <Icon size={34} aria-hidden="true" />
    <h3>{title}</h3>
    <p>{message}</p>
  </div>
);
