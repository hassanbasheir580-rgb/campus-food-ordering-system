export type Role = 'STUDENT' | 'VENDOR' | 'ADMIN' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'CALLED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'TNG' | 'CARD' | 'ONLINE_BANKING' | 'CASHLESS_WALLET';
export type QueueStatus = 'WAITING' | 'CALLED' | 'SERVED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  vendorId?: string;
  profileLabel?: string;
}

export interface Vendor {
  id: string;
  userId: string;
  outletName: string;
  operatingHours: string;
  avgRating: number;
  verificationStatus: string;
  location: string;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  prepTime: number;
  stock: number;
  isAvailable: boolean;
  imageUrl: string;
  vendorName?: string;
  vendorLocation?: string;
  vendorRating?: number;
}

export interface TimeSlot {
  id: string;
  vendorId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  customizations: string | null;
  menuName?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionRef: string;
  failureReason: string | null;
  createdAt: string;
}

export interface QueueTicket {
  id: string;
  orderId: string;
  queueNumber: string;
  estimatedWait: number;
  status: QueueStatus;
  calledAt: string | null;
  servedAt: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  studentId: string;
  vendorId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Order {
  id: string;
  studentId: string;
  vendorId: string;
  status: OrderStatus;
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  totalPrice: number;
  scheduledPickupTime: string | null;
  estimatedPickupTime: string | null;
  createdAt: string;
  updatedAt: string;
  studentName: string;
  vendorName: string;
  items: OrderItem[];
  payment: Payment | null;
  queueTicket: QueueTicket | null;
  review: Review | null;
}

export interface PublicQueueDisplay {
  queueNumber: string;
  orderId: string;
  vendorName: string;
  status: OrderStatus;
  queueStatus: QueueStatus;
  estimatedWait: number;
  message: string;
  lastUpdated: string;
  calledAt: string | null;
}

export interface VendorAnalytics {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
  };
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  dailySales: Array<{ date: string; orders: number; revenue: number }>;
}

export interface AdminReport {
  users: Array<{ role: Role; count: number }>;
  orders: Array<{ status: OrderStatus; count: number }>;
  vendors: Vendor[];
  payment: {
    paidRevenue: number;
    paidCount: number;
    failedCount: number;
  };
  categoryRevenue: Array<{ category: string; revenue: number }>;
}
