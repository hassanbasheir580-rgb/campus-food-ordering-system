import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { FULFILLMENT_TYPE, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, QUEUE_STATUS, ROLES } from '../constants/enums.js';
import { getDb, resetDatabase } from './connection.js';
import { menuRepository } from '../repositories/menu.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { userRepository } from '../repositories/user.repository.js';

const passwordHash = (password: string) => bcrypt.hashSync(password, 10);

const seed = () => {
  resetDatabase();
  const db = getDb();

  settingsRepository.upsert('mockPaymentSuccessRate', String(env.mockPaymentSuccessRate), 'number', 'Probability that the mock payment gateway approves a payment.');
  settingsRepository.upsert('serviceFeePercent', '3', 'number', 'Campus service fee percentage shown in admin configuration.');
  settingsRepository.upsert('operatingHours', '08:00-22:00', 'string', 'Campus-wide ordering operating hours.');
  settingsRepository.upsert('queuePrefix', env.queuePrefix, 'string', 'Prefix used when queue tickets are generated.');
  settingsRepository.upsert('reviewRequiredForRating', 'false', 'boolean', 'Whether a text review is required with a star rating.');

  const student = userRepository.createBaseUser({
    name: 'Hassan Basheir',
    email: 'student@campus.test',
    passwordHash: passwordHash('Student123!'),
    phone: '+60 12-100 2001',
    role: ROLES.STUDENT
  });
  userRepository.createStudentProfile(student.id, {
    studentNo: '251UC2506T',
    faculty: 'Computing',
    department: 'Software Engineering',
    dietaryPreferences: 'No peanuts'
  });

  const vendorUser = userRepository.createBaseUser({
    name: 'Rashad Sofan',
    email: 'vendor@campus.test',
    passwordHash: passwordHash('Vendor123!'),
    phone: '+60 12-100 2002',
    role: ROLES.VENDOR
  });
  const vendorId = userRepository.createVendorProfile(vendorUser.id, {
    outletName: 'Campus Bites',
    operatingHours: '08:00-21:30',
    location: 'Central Food Court, Level 1'
  });

  const secondVendorUser = userRepository.createBaseUser({
    name: 'Nasi Corner Operator',
    email: 'vendor2@campus.test',
    passwordHash: passwordHash('Vendor123!'),
    phone: '+60 12-100 2005',
    role: ROLES.VENDOR
  });
  const secondVendorId = userRepository.createVendorProfile(secondVendorUser.id, {
    outletName: 'Nasi Corner',
    operatingHours: '09:00-20:00',
    location: 'Library Walkway Kiosk'
  });

  const admin = userRepository.createBaseUser({
    name: 'Ahmad Aljammal',
    email: 'admin@campus.test',
    passwordHash: passwordHash('Admin123!'),
    phone: '+60 12-100 2003',
    role: ROLES.ADMIN
  });
  userRepository.createAdminProfile(admin.id, {
    adminLevel: 'Campus Dining',
    department: 'Student Services',
    accessPermissions: 'USERS,VENDORS,REPORTS,SETTINGS'
  });

  const staff = userRepository.createBaseUser({
    name: 'Mohammed Alakklouk',
    email: 'staff@campus.test',
    passwordHash: passwordHash('Staff123!'),
    phone: '+60 12-100 2004',
    role: ROLES.STAFF
  });
  userRepository.createStaffProfile(staff.id, {
    assignedOutlet: 'Central Food Court',
    permissions: 'QUEUE_CALL,PICKUP_CONFIRM'
  });

  const menu = [
    menuRepository.create(vendorId, {
      name: 'Teriyaki Chicken Rice Bowl',
      description: 'Grilled chicken, rice, vegetables, sesame, and teriyaki glaze.',
      price: 12.9,
      category: 'Rice Bowls',
      prepTime: 12,
      stock: 35,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'
    }),
    menuRepository.create(vendorId, {
      name: 'Campus Veggie Wrap',
      description: 'Wholegrain wrap with hummus, roasted vegetables, greens, and yogurt sauce.',
      price: 8.5,
      category: 'Grab & Go',
      prepTime: 7,
      stock: 24,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?auto=format&fit=crop&w=900&q=80'
    }),
    menuRepository.create(vendorId, {
      name: 'Iced Matcha Latte',
      description: 'Cold matcha latte with oat milk option and light vanilla syrup.',
      price: 6.8,
      category: 'Drinks',
      prepTime: 4,
      stock: 40,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=900&q=80'
    }),
    menuRepository.create(vendorId, {
      name: 'Crispy Chicken Burger',
      description: 'Crispy chicken fillet, campus slaw, pickles, and house sauce.',
      price: 13.5,
      category: 'Burgers',
      prepTime: 14,
      stock: 18,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80'
    }),
    menuRepository.create(vendorId, {
      name: 'Sold Out Brownie Box',
      description: 'Chocolate brownie snack box for afternoon breaks.',
      price: 5.5,
      category: 'Dessert',
      prepTime: 3,
      stock: 0,
      isAvailable: false,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80'
    }),
    menuRepository.create(secondVendorId, {
      name: 'Nasi Lemak Ayam',
      description: 'Coconut rice, sambal, egg, cucumber, peanuts, and spiced fried chicken.',
      price: 11.9,
      category: 'Local Favorites',
      prepTime: 10,
      stock: 30,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80'
    }),
    menuRepository.create(secondVendorId, {
      name: 'Milo Dinosaur',
      description: 'Iced Milo with extra malt powder, a classic campus drink.',
      price: 4.8,
      category: 'Drinks',
      prepTime: 3,
      stock: 50,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80'
    })
  ];

  for (const vendor of [vendorId, secondVendorId]) {
    for (const [start, end, capacity, booked] of [
      ['2026-06-16T11:30:00.000Z', '2026-06-16T12:00:00.000Z', 12, 4],
      ['2026-06-16T12:00:00.000Z', '2026-06-16T12:30:00.000Z', 12, 7],
      ['2026-06-16T12:30:00.000Z', '2026-06-16T13:00:00.000Z', 10, 3],
      ['2026-06-16T18:00:00.000Z', '2026-06-16T18:30:00.000Z', 10, 1]
    ] as const) {
      menuRepository.createTimeSlot({ vendorId: vendor, startTime: start, endTime: end, capacity, bookedCount: booked });
    }
  }

  const createSeedOrder = (status: keyof typeof ORDER_STATUS, itemIndex: number, quantity: number, queueStatus: keyof typeof QUEUE_STATUS) => {
    const item = menu[itemIndex];
    const orderId = orderRepository.createOrder({
      studentId: student.id,
      vendorId: item.vendorId,
      status: ORDER_STATUS[status],
      fulfillmentType: FULFILLMENT_TYPE.PICKUP,
      totalPrice: Number((item.price * quantity).toFixed(2)),
      scheduledPickupTime: '2026-06-16T12:30:00.000Z',
      estimatedPickupTime: '2026-06-16T12:45:00.000Z'
    });
    orderRepository.addOrderItem({
      orderId,
      menuItemId: item.id,
      quantity,
      unitPrice: item.price,
      subtotal: Number((item.price * quantity).toFixed(2)),
      customizations: quantity > 1 ? 'Less spicy' : null
    });
    orderRepository.createPayment({
      orderId,
      method: PAYMENT_METHOD.TNG,
      status: PAYMENT_STATUS.PAID,
      amount: Number((item.price * quantity).toFixed(2)),
      transactionRef: `SEED-${orderId.slice(0, 8).toUpperCase()}`
    });
    orderRepository.createQueueTicket(orderId, 10 + item.prepTime, env.queuePrefix);
    orderRepository.updateQueueStatus(orderId, QUEUE_STATUS[queueStatus]);
    return orderId;
  };

  const completedOrderId = createSeedOrder('COMPLETED', 0, 1, 'SERVED');
  createSeedOrder('READY', 3, 1, 'WAITING');
  createSeedOrder('PREPARING', 1, 2, 'WAITING');
  createSeedOrder('CONFIRMED', 5, 1, 'WAITING');

  orderRepository.addReview({
    orderId: completedOrderId,
    studentId: student.id,
    vendorId,
    rating: 5,
    comment: 'Pickup was quick and the queue number display was easy to follow.'
  });

  const failedOrderId = orderRepository.createOrder({
    studentId: student.id,
    vendorId,
    status: ORDER_STATUS.CANCELLED,
    fulfillmentType: FULFILLMENT_TYPE.PICKUP,
    totalPrice: 6.8,
    scheduledPickupTime: null,
    estimatedPickupTime: null
  });
  orderRepository.addOrderItem({
    orderId: failedOrderId,
    menuItemId: menu[2].id,
    quantity: 1,
    unitPrice: menu[2].price,
    subtotal: menu[2].price
  });
  orderRepository.createPayment({
    orderId: failedOrderId,
    method: PAYMENT_METHOD.CARD,
    status: PAYMENT_STATUS.FAILED,
    amount: menu[2].price,
    transactionRef: `SEED-${failedOrderId.slice(0, 8).toUpperCase()}`,
    failureReason: 'Mock gateway declined the transaction'
  });

  const counts = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  console.log(`Seed complete: ${counts.count} users, ${menu.length} menu items, demo database at ${env.databaseUrl}`);
};

seed();
