import type { OrderStatus, PaymentMethod, PaymentStatus, QueueStatus, Role } from '../types/domain';

export const roleHomePath: Record<Role, string> = {
  STUDENT: '/student',
  VENDOR: '/vendor',
  ADMIN: '/admin',
  STAFF: '/staff'
};

export const orderStatusSteps: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'READY', 'CALLED', 'COMPLETED'];

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  CALLED: 'Called',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected'
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  TNG: 'TnG eWallet',
  CARD: 'Credit/Debit Card',
  ONLINE_BANKING: 'Online Banking',
  CASHLESS_WALLET: 'Campus Wallet'
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded'
};

export const queueStatusLabels: Record<QueueStatus, string> = {
  WAITING: 'Waiting',
  CALLED: 'Called',
  SERVED: 'Served',
  CANCELLED: 'Cancelled'
};
