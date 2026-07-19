import { orderStatusLabels, paymentStatusLabels, queueStatusLabels } from '../constants/status';
import type { OrderStatus, PaymentStatus, QueueStatus, UserStatus } from '../types/domain';

type BadgeValue = OrderStatus | PaymentStatus | QueueStatus | UserStatus;

const toneFor = (value: BadgeValue) => {
  if (['PAID', 'ACTIVE', 'COMPLETED', 'SERVED'].includes(value)) return 'success';
  if (['READY', 'CALLED', 'PREPARING'].includes(value)) return 'info';
  if (['PENDING', 'CONFIRMED', 'WAITING'].includes(value)) return 'warning';
  if (['FAILED', 'CANCELLED', 'REJECTED', 'SUSPENDED'].includes(value)) return 'danger';
  return 'neutral';
};

const labelFor = (value: BadgeValue) =>
  orderStatusLabels[value as OrderStatus] ??
  paymentStatusLabels[value as PaymentStatus] ??
  queueStatusLabels[value as QueueStatus] ??
  value;

export const StatusBadge = ({ value }: { value: BadgeValue }) => (
  <span className={`status-badge status-${toneFor(value)}`}>{labelFor(value)}</span>
);
