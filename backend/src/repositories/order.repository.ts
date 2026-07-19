import { randomUUID } from 'node:crypto';
import { getDb } from '../database/connection.js';
import { ORDER_STATUS, PAYMENT_STATUS, QUEUE_STATUS, type OrderStatus, type QueueStatus } from '../constants/enums.js';
import type { Order, OrderDetails, OrderItem, Payment, PublicQueueDisplay, QueueTicket, Review } from '../types/domain.js';
import { nowIso } from '../utils/http.js';

type OrderRow = {
  id: string;
  student_id: string;
  vendor_id: string;
  status: OrderStatus;
  fulfillment_type: Order['fulfillmentType'];
  total_price: number;
  scheduled_pickup_time: string | null;
  estimated_pickup_time: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations: string | null;
  menu_name?: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  method: Payment['method'];
  status: Payment['status'];
  amount: number;
  transaction_ref: string;
  failure_reason: string | null;
  created_at: string;
};

type QueueTicketRow = {
  id: string;
  order_id: string;
  queue_number: string;
  estimated_wait: number;
  status: QueueStatus;
  called_at: string | null;
  served_at: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  order_id: string;
  student_id: string;
  vendor_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

const mapOrder = (row: OrderRow): Order => ({
  id: row.id,
  studentId: row.student_id,
  vendorId: row.vendor_id,
  status: row.status,
  fulfillmentType: row.fulfillment_type,
  totalPrice: row.total_price,
  scheduledPickupTime: row.scheduled_pickup_time,
  estimatedPickupTime: row.estimated_pickup_time,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapOrderItem = (row: OrderItemRow): OrderItem => ({
  id: row.id,
  orderId: row.order_id,
  menuItemId: row.menu_item_id,
  quantity: row.quantity,
  unitPrice: row.unit_price,
  subtotal: row.subtotal,
  customizations: row.customizations,
  menuName: row.menu_name
});

const mapPayment = (row: PaymentRow): Payment => ({
  id: row.id,
  orderId: row.order_id,
  method: row.method,
  status: row.status,
  amount: row.amount,
  transactionRef: row.transaction_ref,
  failureReason: row.failure_reason,
  createdAt: row.created_at
});

const mapQueueTicket = (row: QueueTicketRow): QueueTicket => ({
  id: row.id,
  orderId: row.order_id,
  queueNumber: row.queue_number,
  estimatedWait: row.estimated_wait,
  status: row.status,
  calledAt: row.called_at,
  servedAt: row.served_at,
  createdAt: row.created_at
});

const mapReview = (row: ReviewRow): Review => ({
  id: row.id,
  orderId: row.order_id,
  studentId: row.student_id,
  vendorId: row.vendor_id,
  rating: row.rating,
  comment: row.comment,
  createdAt: row.created_at
});

const nextQueueNumber = (prefix: string) => {
  const row = getDb()
    .prepare(
      `SELECT queue_number
       FROM queue_tickets
       WHERE queue_number LIKE ?
       ORDER BY CAST(SUBSTR(queue_number, 2) AS INTEGER) DESC
       LIMIT 1`
    )
    .get(`${prefix}%`) as { queue_number: string } | undefined;
  const lastNumber = row ? Number(row.queue_number.slice(prefix.length)) : 100;
  return `${prefix}${lastNumber + 1}`;
};

export const orderRepository = {
  createOrder(input: {
    studentId: string;
    vendorId: string;
    fulfillmentType: Order['fulfillmentType'];
    totalPrice: number;
    scheduledPickupTime?: string | null;
    estimatedPickupTime?: string | null;
    status?: OrderStatus;
  }) {
    const id = randomUUID();
    const timestamp = nowIso();
    getDb()
      .prepare(
        `INSERT INTO orders
         (id, student_id, vendor_id, status, fulfillment_type, total_price, scheduled_pickup_time, estimated_pickup_time, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.studentId,
        input.vendorId,
        input.status ?? ORDER_STATUS.PENDING,
        input.fulfillmentType,
        input.totalPrice,
        input.scheduledPickupTime ?? null,
        input.estimatedPickupTime ?? null,
        timestamp,
        timestamp
      );
    return id;
  },

  addOrderItem(input: {
    orderId: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    customizations?: string | null;
  }) {
    getDb()
      .prepare(
        `INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, subtotal, customizations)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        randomUUID(),
        input.orderId,
        input.menuItemId,
        input.quantity,
        input.unitPrice,
        input.subtotal,
        input.customizations ?? null
      );
  },

  createPayment(input: {
    orderId: string;
    method: Payment['method'];
    status: Payment['status'];
    amount: number;
    transactionRef: string;
    failureReason?: string | null;
  }) {
    getDb()
      .prepare(
        `INSERT INTO payments (id, order_id, method, status, amount, transaction_ref, failure_reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        randomUUID(),
        input.orderId,
        input.method,
        input.status,
        input.amount,
        input.transactionRef,
        input.failureReason ?? null,
        nowIso()
      );
  },

  createQueueTicket(orderId: string, estimatedWait: number, prefix: string) {
    const queueNumber = nextQueueNumber(prefix);
    getDb()
      .prepare(
        `INSERT INTO queue_tickets (id, order_id, queue_number, estimated_wait, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(randomUUID(), orderId, queueNumber, estimatedWait, QUEUE_STATUS.WAITING, nowIso());
  },

  updateStatus(orderId: string, status: OrderStatus) {
    getDb()
      .prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, nowIso(), orderId);
    return this.findDetails(orderId);
  },

  updateQueueStatus(orderId: string, status: QueueStatus) {
    const calledAt = status === QUEUE_STATUS.CALLED ? nowIso() : null;
    const servedAt = status === QUEUE_STATUS.SERVED ? nowIso() : null;
    getDb()
      .prepare(
        `UPDATE queue_tickets
         SET status = ?,
             called_at = COALESCE(?, called_at),
             served_at = COALESCE(?, served_at)
         WHERE order_id = ?`
      )
      .run(status, calledAt, servedAt, orderId);
  },

  findById(orderId: string) {
    const row = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
    return row ? mapOrder(row) : null;
  },

  findDetails(orderId: string): OrderDetails | null {
    const row = getDb()
      .prepare(
        `SELECT o.*, u.name AS student_name, v.outlet_name AS vendor_name
         FROM orders o
         JOIN users u ON u.id = o.student_id
         JOIN vendors v ON v.id = o.vendor_id
         WHERE o.id = ?`
      )
      .get(orderId) as (OrderRow & { student_name: string; vendor_name: string }) | undefined;

    if (!row) return null;
    return {
      ...mapOrder(row),
      studentName: row.student_name,
      vendorName: row.vendor_name,
      items: this.listItems(orderId),
      payment: this.findPayment(orderId),
      queueTicket: this.findQueueTicket(orderId),
      review: this.findReview(orderId)
    };
  },

  listItems(orderId: string) {
    const rows = getDb()
      .prepare(
        `SELECT oi.*, mi.name AS menu_name
         FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id
         WHERE oi.order_id = ?
         ORDER BY mi.name`
      )
      .all(orderId) as OrderItemRow[];
    return rows.map(mapOrderItem);
  },

  findPayment(orderId: string) {
    const row = getDb().prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId) as PaymentRow | undefined;
    return row ? mapPayment(row) : null;
  },

  findQueueTicket(orderId: string) {
    const row = getDb()
      .prepare('SELECT * FROM queue_tickets WHERE order_id = ?')
      .get(orderId) as QueueTicketRow | undefined;
    return row ? mapQueueTicket(row) : null;
  },

  findReview(orderId: string) {
    const row = getDb().prepare('SELECT * FROM reviews WHERE order_id = ?').get(orderId) as ReviewRow | undefined;
    return row ? mapReview(row) : null;
  },

  listByStudent(studentId: string) {
    const rows = getDb()
      .prepare('SELECT id FROM orders WHERE student_id = ? ORDER BY created_at DESC')
      .all(studentId) as { id: string }[];
    return rows.map((row) => this.findDetails(row.id)!).filter(Boolean);
  },

  listByVendor(vendorId: string) {
    const rows = getDb()
      .prepare('SELECT id FROM orders WHERE vendor_id = ? ORDER BY created_at DESC')
      .all(vendorId) as { id: string }[];
    return rows.map((row) => this.findDetails(row.id)!).filter(Boolean);
  },

  listQueue() {
    const rows = getDb()
      .prepare(
        `SELECT qt.order_id AS id
         FROM queue_tickets qt
         JOIN orders o ON o.id = qt.order_id
         WHERE qt.status IN ('WAITING','CALLED') AND o.status IN ('CONFIRMED','PREPARING','READY','CALLED')
         ORDER BY qt.created_at`
      )
      .all() as { id: string }[];
    return rows.map((row) => this.findDetails(row.id)!).filter(Boolean);
  },

  publicQueueDisplay(): PublicQueueDisplay | null {
    const row = getDb()
      .prepare(
        `SELECT qt.order_id AS id
         FROM queue_tickets qt
         JOIN orders o ON o.id = qt.order_id
         WHERE (qt.status = ? AND o.status = ?)
            OR (qt.status = ? AND o.status = ?)
         ORDER BY
           CASE WHEN qt.status = ? THEN 0 ELSE 1 END,
           COALESCE(qt.called_at, o.updated_at, qt.created_at) DESC
         LIMIT 1`
      )
      .get(
        QUEUE_STATUS.CALLED,
        ORDER_STATUS.CALLED,
        QUEUE_STATUS.WAITING,
        ORDER_STATUS.READY,
        QUEUE_STATUS.CALLED
      ) as { id: string } | undefined;

    if (!row) return null;
    const order = this.findDetails(row.id);
    if (!order?.queueTicket) return null;

    const isCalled = order.queueTicket.status === QUEUE_STATUS.CALLED;
    return {
      queueNumber: order.queueTicket.queueNumber,
      orderId: order.id,
      vendorName: order.vendorName,
      status: order.status,
      queueStatus: order.queueTicket.status,
      estimatedWait: isCalled ? 0 : order.queueTicket.estimatedWait,
      message: isCalled ? 'Please proceed to the pickup counter' : 'Ready and waiting to be called',
      lastUpdated: order.queueTicket.calledAt ?? order.updatedAt ?? order.queueTicket.createdAt,
      calledAt: order.queueTicket.calledAt
    };
  },

  addReview(input: { orderId: string; studentId: string; vendorId: string; rating: number; comment: string }) {
    getDb()
      .prepare(
        `INSERT INTO reviews (id, order_id, student_id, vendor_id, rating, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(randomUUID(), input.orderId, input.studentId, input.vendorId, input.rating, input.comment, nowIso());

    getDb()
      .prepare(
        `UPDATE vendors
         SET avg_rating = (
           SELECT ROUND(AVG(rating), 2) FROM reviews WHERE vendor_id = ?
         )
         WHERE id = ?`
      )
      .run(input.vendorId, input.vendorId);

    return this.findDetails(input.orderId);
  },

  paymentCounts() {
    return getDb()
      .prepare(
        `SELECT
          SUM(CASE WHEN status = ? THEN amount ELSE 0 END) AS paid_revenue,
          SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS paid_count,
          SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS failed_count
         FROM payments`
      )
      .get(PAYMENT_STATUS.PAID, PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED) as {
      paid_revenue: number | null;
      paid_count: number | null;
      failed_count: number | null;
    };
  }
};
