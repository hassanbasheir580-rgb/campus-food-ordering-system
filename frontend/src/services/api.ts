import { appConfig } from '../config/appConfig';
import type { AdminReport, MenuItem, Order, PaymentMethod, PublicQueueDisplay, TimeSlot, User, Vendor, VendorAnalytics } from '../types/domain';
import { storage } from './storage';

type RequestOptions = RequestInit & { auth?: boolean };

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (options.auth !== false) {
    const token = storage.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${appConfig.apiUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const api = {
  login(email: string, password: string) {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password })
    });
  },
  register(input: { name: string; email: string; password: string; phone?: string }) {
    return request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input)
    });
  },
  publicQueueDisplay() {
    return request<{ current: PublicQueueDisplay | null }>('/queue/display', { auth: false });
  },
  me() {
    return request<{ user: User }>('/auth/me');
  },
  menu() {
    return request<{ items: MenuItem[]; vendors: Vendor[] }>('/menu', { auth: false });
  },
  timeSlots(vendorId?: string) {
    const query = vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : '';
    return request<{ timeSlots: TimeSlot[] }>(`/menu/time-slots${query}`, { auth: false });
  },
  createOrder(input: {
    items: Array<{ menuItemId: string; quantity: number; customizations?: string }>;
    paymentMethod: PaymentMethod;
    scheduledPickupTime?: string;
    timeSlotId?: string;
    fulfillmentType: 'PICKUP' | 'DELIVERY';
  }) {
    return request<{ order: Order; paymentSucceeded: boolean }>('/orders', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },
  myOrders() {
    return request<{ orders: Order[] }>('/orders/my');
  },
  submitReview(orderId: string, rating: number, comment: string) {
    return request<{ order: Order }>(`/orders/${orderId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  },
  vendorDashboard() {
    return request<{ menu: MenuItem[]; orders: Order[]; analytics: VendorAnalytics }>('/vendor/dashboard');
  },
  saveMenuItem(input: Partial<MenuItem> & { id?: string }) {
    const body = {
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      prepTime: input.prepTime,
      stock: input.stock,
      isAvailable: input.isAvailable,
      imageUrl: input.imageUrl
    };
    return input.id
      ? request<{ item: MenuItem }>(`/vendor/menu/${input.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      : request<{ item: MenuItem }>('/vendor/menu', { method: 'POST', body: JSON.stringify(body) });
  },
  deleteMenuItem(id: string) {
    return request<void>(`/vendor/menu/${id}`, { method: 'DELETE' });
  },
  vendorAcceptOrder(orderId: string) {
    return request<{ order: Order }>(`/vendor/orders/${orderId}/accept`, { method: 'POST' });
  },
  vendorRejectOrder(orderId: string) {
    return request<{ order: Order }>(`/vendor/orders/${orderId}/reject`, { method: 'POST' });
  },
  vendorUpdateStatus(orderId: string, status: 'PREPARING' | 'READY' | 'CANCELLED') {
    return request<{ order: Order }>(`/vendor/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  adminDashboard() {
    return request<{ report: AdminReport; users: User[]; settings: Array<{ key: string; value: string | number | boolean; type: string; description: string }> }>(
      '/admin/dashboard'
    );
  },
  updateUserStatus(id: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED') {
    return request<{ user: User }>(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  adminCreateVendor(input: {
    outletName: string;
    name?: string;
    email: string;
    phone?: string;
    operatingHours: string;
    location?: string;
    password: string;
  }) {
    return request<{ user: User }>('/admin/vendors', { method: 'POST', body: JSON.stringify(input) });
  },
  adminCreateStaff(input: { name: string; email: string; phone?: string; assignedOutlet?: string; password: string }) {
    return request<{ user: User }>('/admin/staff', { method: 'POST', body: JSON.stringify(input) });
  },
  adminUpdatePassword(id: string, password: string) {
    return request<{ user: User }>(`/admin/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) });
  },
  updateSettings(input: Record<string, string | number | boolean>) {
    return request<{ settings: Array<{ key: string; value: string | number | boolean; type: string; description: string }> }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  },
  async exportAdminCsv() {
    const token = storage.getToken();
    const response = await fetch(`${appConfig.apiUrl}/admin/reports/export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!response.ok) throw new Error('Report export failed');
    return response.blob();
  },
  staffQueue() {
    return request<{ queue: Order[] }>('/staff/queue');
  },
  staffCallNext(orderId?: string) {
    return request<{ order: Order }>('/staff/queue/call-next', { method: 'POST', body: JSON.stringify({ orderId }) });
  },
  staffComplete(orderId: string) {
    return request<{ order: Order }>(`/staff/orders/${orderId}/complete`, { method: 'POST' });
  }
};
