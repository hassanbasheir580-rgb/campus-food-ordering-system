export const ROLES = {
  STUDENT: 'STUDENT',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF'
} as const;

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED'
} as const;

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  CALLED: 'CALLED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
} as const;

export const PAYMENT_METHOD = {
  TNG: 'TNG',
  CARD: 'CARD',
  ONLINE_BANKING: 'ONLINE_BANKING',
  CASHLESS_WALLET: 'CASHLESS_WALLET'
} as const;

export const QUEUE_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED'
} as const;

export const FULFILLMENT_TYPE = {
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY'
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
export type QueueStatus = (typeof QUEUE_STATUS)[keyof typeof QUEUE_STATUS];
export type FulfillmentType = (typeof FULFILLMENT_TYPE)[keyof typeof FULFILLMENT_TYPE];

export const ROLE_HOME_PATH: Record<Role, string> = {
  STUDENT: '/student',
  VENDOR: '/vendor',
  ADMIN: '/admin',
  STAFF: '/staff'
};

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
  CONFIRMED: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
  PREPARING: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  READY: [ORDER_STATUS.CALLED],
  CALLED: [ORDER_STATUS.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: []
};

export const ROLE_ALLOWED_STATUS_UPDATES: Record<Role, OrderStatus[]> = {
  STUDENT: [ORDER_STATUS.CANCELLED],
  VENDOR: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED
  ],
  ADMIN: Object.values(ORDER_STATUS),
  STAFF: [ORDER_STATUS.CALLED, ORDER_STATUS.COMPLETED]
};
