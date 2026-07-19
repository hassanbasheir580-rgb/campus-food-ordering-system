import { strict as assert } from 'node:assert';
import { createApp } from '../app.js';

type Role = 'STUDENT' | 'VENDOR' | 'ADMIN' | 'STAFF';
type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'CALLED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  vendorId?: string;
  passwordHash?: string;
};

type ApiMenuItem = {
  id: string;
  vendorId: string;
  vendorName: string;
  isAvailable: boolean;
  stock: number;
};

type ApiOrder = {
  id: string;
  vendorId: string;
  vendorName: string;
  status: OrderStatus;
  queueTicket: null | {
    queueNumber: string;
    estimatedWait: number;
    status: 'WAITING' | 'CALLED' | 'SERVED' | 'CANCELLED';
  };
  payment: null | {
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  };
  review: null | {
    rating: number;
    comment: string;
  };
};

type PublicQueueDisplay = {
  queueNumber: string;
  orderId: string;
  vendorName: string;
  status: OrderStatus;
  queueStatus: 'WAITING' | 'CALLED' | 'SERVED' | 'CANCELLED';
  estimatedWait: number;
  message: string;
  lastUpdated: string;
};

const app = createApp();
const server = app.listen(0);
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const baseUrl = `http://127.0.0.1:${port}/api`;

const jsonRequest = async <T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown; expected?: number } = {}
) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as T);
  assert.equal(response.status, options.expected ?? 200, `${options.method ?? 'GET'} ${path} returned ${response.status}: ${text}`);
  return data;
};

const login = async (email: string, password: string) =>
  jsonRequest<{ user: ApiUser; token: string }>('/auth/login', {
    method: 'POST',
    body: { email, password }
  });

try {
  const health = await jsonRequest<{ ok: boolean }>('/health');
  assert.equal(health.ok, true);

  const student = await login('student@campus.test', 'Student123!');
  const vendor = await login('vendor@campus.test', 'Vendor123!');
  const admin = await login('admin@campus.test', 'Admin123!');
  const staff = await login('staff@campus.test', 'Staff123!');
  assert.equal(student.user.role, 'STUDENT');
  assert.equal(vendor.user.role, 'VENDOR');
  assert.equal(admin.user.role, 'ADMIN');
  assert.equal(staff.user.role, 'STAFF');

  const initialDisplay = await jsonRequest<{ current: PublicQueueDisplay | null }>('/queue/display');
  assert.ok(initialDisplay.current, 'Seeded ready queue should be visible on the public display');
  assert.ok(['READY', 'CALLED'].includes(initialDisplay.current.status));

  const selfRegistered = await jsonRequest<{ user: ApiUser; token: string }>('/auth/register', {
    method: 'POST',
    expected: 201,
    body: {
      name: 'Self Registered Customer',
      email: `student.${Date.now()}@campus.test`,
      password: 'Student123!',
      phone: '+60 12-555 9000'
    }
  });
  assert.equal(selfRegistered.user.role, 'STUDENT');

  await jsonRequest('/auth/register', {
    method: 'POST',
    expected: 400,
    body: {
      name: 'Forbidden Vendor',
      email: `forbidden.vendor.${Date.now()}@campus.test`,
      password: 'Vendor123!',
      role: 'VENDOR'
    }
  });

  await jsonRequest('/admin/dashboard', { token: student.token, expected: 403 });
  await jsonRequest('/staff/queue', { token: student.token, expected: 403 });
  await jsonRequest('/admin/dashboard', { token: vendor.token, expected: 403 });
  await jsonRequest('/vendor/menu', { token: staff.token, expected: 403 });

  await jsonRequest('/admin/settings', {
    method: 'PUT',
    token: admin.token,
    body: { mockPaymentSuccessRate: 1 }
  });

  const menu = await jsonRequest<{ items: ApiMenuItem[] }>('/menu');
  const campusBitesItem = menu.items.find((item) => item.vendorName === 'Campus Bites' && item.isAvailable && item.stock > 0);
  assert.ok(campusBitesItem, 'Expected an available Campus Bites seed item');

  const created = await jsonRequest<{ order: ApiOrder; paymentSucceeded: boolean }>('/orders', {
    method: 'POST',
    token: student.token,
    expected: 201,
    body: {
      items: [{ menuItemId: campusBitesItem.id, quantity: 1 }],
      paymentMethod: 'TNG',
      fulfillmentType: 'PICKUP'
    }
  });
  assert.equal(created.paymentSucceeded, true);
  assert.equal(created.order.status, 'CONFIRMED');
  assert.equal(created.order.payment?.status, 'PAID');
  assert.ok(created.order.queueTicket?.queueNumber);

  await jsonRequest(`/orders/${created.order.id}/review`, {
    method: 'POST',
    token: student.token,
    expected: 400,
    body: { rating: 4, comment: 'Trying too early' }
  });

  const accepted = await jsonRequest<{ order: ApiOrder }>(`/vendor/orders/${created.order.id}/accept`, {
    method: 'POST',
    token: vendor.token
  });
  assert.equal(accepted.order.status, 'PREPARING');

  const ready = await jsonRequest<{ order: ApiOrder }>(`/vendor/orders/${created.order.id}/status`, {
    method: 'PATCH',
    token: vendor.token,
    body: { status: 'READY' }
  });
  assert.equal(ready.order.status, 'READY');

  const studentReady = await jsonRequest<{ order: ApiOrder }>(`/orders/${created.order.id}`, { token: student.token });
  assert.equal(studentReady.order.status, 'READY');

  const adminQueue = await jsonRequest<{ queue: ApiOrder[] }>('/orders/queue', { token: admin.token });
  const otherVendorOrder = adminQueue.queue.find((order) => order.vendorName === 'Nasi Corner');
  assert.ok(otherVendorOrder, 'Expected a seeded order for another vendor');

  const vendorQueue = await jsonRequest<{ queue: ApiOrder[] }>('/orders/queue', { token: vendor.token });
  assert.ok(vendorQueue.queue.every((order) => order.vendorName === 'Campus Bites'));

  await jsonRequest(`/orders/${otherVendorOrder.id}/status`, {
    method: 'PATCH',
    token: vendor.token,
    expected: 403,
    body: { status: 'PREPARING' }
  });

  await jsonRequest(`/staff/orders/${created.order.id}/complete`, {
    method: 'POST',
    token: staff.token,
    expected: 400
  });

  const called = await jsonRequest<{ order: ApiOrder }>('/staff/queue/call-next', {
    method: 'POST',
    token: staff.token,
    body: { orderId: created.order.id }
  });
  assert.equal(called.order.status, 'CALLED');
  assert.equal(called.order.queueTicket?.status, 'CALLED');

  const calledDisplay = await jsonRequest<{ current: PublicQueueDisplay | null }>('/queue/display');
  assert.equal(calledDisplay.current?.orderId, created.order.id);
  assert.equal(calledDisplay.current?.queueStatus, 'CALLED');

  const studentCalled = await jsonRequest<{ order: ApiOrder }>(`/orders/${created.order.id}`, { token: student.token });
  assert.equal(studentCalled.order.status, 'CALLED');

  const completed = await jsonRequest<{ order: ApiOrder }>(`/staff/orders/${created.order.id}/complete`, {
    method: 'POST',
    token: staff.token
  });
  assert.equal(completed.order.status, 'COMPLETED');

  await jsonRequest<{ order: ApiOrder }>(`/orders/${created.order.id}/review`, {
    method: 'POST',
    token: student.token,
    expected: 201,
    body: { rating: 5, comment: 'Pickup and queue update worked correctly.' }
  });

  await jsonRequest(`/orders/${created.order.id}/review`, {
    method: 'POST',
    token: student.token,
    expected: 409,
    body: { rating: 5, comment: 'Duplicate review should fail.' }
  });

  const analytics = await jsonRequest<{ summary: { averageRating: number } }>('/vendor/analytics', { token: vendor.token });
  assert.ok(analytics.summary.averageRating > 0);

  const timestamp = Date.now();
  const vendorEmail = `admin.vendor.${timestamp}@campus.test`;
  const createdVendor = await jsonRequest<{ user: ApiUser }>('/admin/vendors', {
    method: 'POST',
    token: admin.token,
    expected: 201,
    body: {
      outletName: 'Admin Created Outlet',
      email: vendorEmail,
      phone: '+60 12-555 9101',
      operatingHours: '09:00-18:00',
      password: 'NewVendor123!'
    }
  });
  assert.equal(createdVendor.user.role, 'VENDOR');
  const createdVendorLogin = await login(vendorEmail, 'NewVendor123!');

  await jsonRequest(`/admin/users/${createdVendor.user.id}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'SUSPENDED' }
  });
  await jsonRequest('/auth/login', {
    method: 'POST',
    expected: 403,
    body: { email: vendorEmail, password: 'NewVendor123!' }
  });
  await jsonRequest('/vendor/dashboard', { token: createdVendorLogin.token, expected: 401 });

  const staffEmail = `admin.staff.${timestamp}@campus.test`;
  const createdStaff = await jsonRequest<{ user: ApiUser }>('/admin/staff', {
    method: 'POST',
    token: admin.token,
    expected: 201,
    body: {
      name: 'Admin Created Staff',
      email: staffEmail,
      phone: '+60 12-555 9102',
      assignedOutlet: 'Campus Bites',
      password: 'NewStaff123!'
    }
  });
  assert.equal(createdStaff.user.role, 'STAFF');
  const createdStaffLogin = await login(staffEmail, 'NewStaff123!');

  await jsonRequest(`/admin/users/${createdStaff.user.id}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'SUSPENDED' }
  });
  await jsonRequest('/auth/login', {
    method: 'POST',
    expected: 403,
    body: { email: staffEmail, password: 'NewStaff123!' }
  });
  await jsonRequest('/staff/queue', { token: createdStaffLogin.token, expected: 401 });

  await jsonRequest(`/admin/users/${createdStaff.user.id}/password`, {
    method: 'PATCH',
    token: admin.token,
    body: { password: 'StaffReset123!' }
  });
  await jsonRequest(`/admin/users/${createdStaff.user.id}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'ACTIVE' }
  });
  const resetStaffLogin = await login(staffEmail, 'StaffReset123!');
  assert.equal(resetStaffLogin.user.role, 'STAFF');

  const adminDashboard = await jsonRequest<{ users: ApiUser[] }>('/admin/dashboard', { token: admin.token });
  const seededAdmin = adminDashboard.users.find((user) => user.role === 'ADMIN');
  assert.ok(seededAdmin, 'Expected seeded admin user');
  assert.equal(seededAdmin.passwordHash, undefined);

  await jsonRequest(`/admin/users/${seededAdmin.id}/status`, {
    method: 'PATCH',
    token: admin.token,
    expected: 400,
    body: { status: 'SUSPENDED' }
  });

  await jsonRequest('/admin/settings', {
    method: 'PUT',
    token: admin.token,
    body: { mockPaymentSuccessRate: 0 }
  });
  const failedPayment = await jsonRequest<{ order: ApiOrder; paymentSucceeded: boolean }>('/orders', {
    method: 'POST',
    token: student.token,
    expected: 201,
    body: {
      items: [{ menuItemId: campusBitesItem.id, quantity: 1 }],
      paymentMethod: 'CARD',
      fulfillmentType: 'PICKUP'
    }
  });
  assert.equal(failedPayment.paymentSucceeded, false);
  assert.equal(failedPayment.order.status, 'CANCELLED');
  assert.equal(failedPayment.order.payment?.status, 'FAILED');
  assert.equal(failedPayment.order.queueTicket, null);

  console.log('Backend scenario test passed');
} finally {
  server.close();
}
