import type {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  QueueStatus,
  Role,
  UserStatus
} from '../constants/enums.js';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  vendorId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
}

export interface Order {
  id: string;
  studentId: string;
  vendorId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  totalPrice: number;
  scheduledPickupTime: string | null;
  estimatedPickupTime: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface OrderDetails extends Order {
  studentName: string;
  vendorName: string;
  items: OrderItem[];
  payment: Payment | null;
  queueTicket: QueueTicket | null;
  review: Review | null;
}

export interface AuthUser extends User {
  vendorId?: string;
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
