import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import {
  ORDER_STATUS,
  ORDER_TRANSITIONS,
  PAYMENT_STATUS,
  QUEUE_STATUS,
  ROLE_ALLOWED_STATUS_UPDATES,
  ROLES,
  type OrderStatus,
  type PaymentMethod
} from '../constants/enums.js';
import { getDb } from '../database/connection.js';
import { menuRepository } from '../repositories/menu.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import type { AuthUser } from '../types/domain.js';
import { assertFound, currency, HttpError } from '../utils/http.js';
import { realtime } from './realtime.service.js';

export type CartLineInput = {
  menuItemId: string;
  quantity: number;
  customizations?: string;
};

const estimatePickup = (maxPrepTime: number) => new Date(Date.now() + maxPrepTime * 60_000).toISOString();

export const orderService = {
  createOrder(
    user: AuthUser,
    input: {
      items: CartLineInput[];
      paymentMethod: PaymentMethod;
      scheduledPickupTime?: string;
      timeSlotId?: string;
      fulfillmentType: 'PICKUP' | 'DELIVERY';
    }
  ) {
    if (user.role !== ROLES.STUDENT) throw new HttpError(403, 'Only students can place orders');
    if (!input.items.length) throw new HttpError(400, 'Cart cannot be empty');

    const menuItems = menuRepository.findMany(input.items.map((item) => item.menuItemId));
    if (menuItems.length !== input.items.length) throw new HttpError(400, 'One or more menu items could not be found');

    const vendorIds = new Set(menuItems.map((item) => item.vendorId));
    if (vendorIds.size !== 1) throw new HttpError(400, 'A single order can contain items from one vendor only');

    const lineItems = input.items.map((line) => {
      if (line.quantity <= 0) throw new HttpError(400, 'Quantity must be greater than zero');
      const menuItem = assertFound(menuItems.find((item) => item.id === line.menuItemId), 'Menu item not found');
      if (!menuItem.isAvailable || menuItem.stock < line.quantity) {
        throw new HttpError(400, `${menuItem.name} is unavailable or out of stock`);
      }
      return {
        menuItem,
        quantity: line.quantity,
        customizations: line.customizations ?? null,
        subtotal: currency(menuItem.price * line.quantity)
      };
    });

    const totalPrice = currency(lineItems.reduce((sum, line) => sum + line.subtotal, 0));
    const maxPrepTime = Math.max(...lineItems.map((line) => line.menuItem.prepTime));
    const estimatedWait = Math.max(5, orderRepository.listQueue().length * 4 + maxPrepTime);
    const paymentRate = settingsRepository.getNumber('mockPaymentSuccessRate', env.mockPaymentSuccessRate);
    const paymentSucceeded = Math.random() <= paymentRate;
    const db = getDb();

    try {
      db.exec('BEGIN');
      const orderId = orderRepository.createOrder({
        studentId: user.id,
        vendorId: lineItems[0].menuItem.vendorId,
        fulfillmentType: input.fulfillmentType,
        totalPrice,
        scheduledPickupTime: input.scheduledPickupTime ?? null,
        estimatedPickupTime: input.scheduledPickupTime ?? estimatePickup(estimatedWait),
        status: paymentSucceeded ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.CANCELLED
      });

      for (const line of lineItems) {
        orderRepository.addOrderItem({
          orderId,
          menuItemId: line.menuItem.id,
          quantity: line.quantity,
          unitPrice: line.menuItem.price,
          subtotal: line.subtotal,
          customizations: line.customizations
        });
        if (paymentSucceeded) menuRepository.decrementStock(line.menuItem.id, line.quantity);
      }

      orderRepository.createPayment({
        orderId,
        method: input.paymentMethod,
        status: paymentSucceeded ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED,
        amount: totalPrice,
        transactionRef: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
        failureReason: paymentSucceeded ? null : 'Mock gateway declined the transaction'
      });

      if (paymentSucceeded) {
        orderRepository.createQueueTicket(orderId, estimatedWait, env.queuePrefix);
        if (input.timeSlotId) menuRepository.bookSlot(input.timeSlotId);
      }

      db.exec('COMMIT');
      const order = orderRepository.findDetails(orderId)!;
      realtime.orderUpdated(order);
      return { order, paymentSucceeded };
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  },

  updateOrderStatus(user: AuthUser, orderId: string, newStatus: OrderStatus) {
    const order = assertFound(orderRepository.findDetails(orderId), 'Order not found');
    const allowedByRole = ROLE_ALLOWED_STATUS_UPDATES[user.role].includes(newStatus);
    const validTransition = ORDER_TRANSITIONS[order.status].includes(newStatus);

    if (!allowedByRole || !validTransition) {
      throw new HttpError(400, `Cannot move order from ${order.status} to ${newStatus} as ${user.role}`);
    }

    if (user.role === ROLES.VENDOR && user.vendorId !== order.vendorId) {
      throw new HttpError(403, 'Vendor can update only own outlet orders');
    }

    if (newStatus === ORDER_STATUS.CALLED) orderRepository.updateQueueStatus(orderId, QUEUE_STATUS.CALLED);
    if (newStatus === ORDER_STATUS.COMPLETED) orderRepository.updateQueueStatus(orderId, QUEUE_STATUS.SERVED);
    if (newStatus === ORDER_STATUS.CANCELLED || newStatus === ORDER_STATUS.REJECTED) {
      orderRepository.updateQueueStatus(orderId, QUEUE_STATUS.CANCELLED);
    }

    const updated = orderRepository.updateStatus(orderId, newStatus)!;
    realtime.orderUpdated(updated);
    return updated;
  },

  submitReview(user: AuthUser, orderId: string, rating: number, comment: string) {
    if (user.role !== ROLES.STUDENT) throw new HttpError(403, 'Only students can submit reviews');
    const order = assertFound(orderRepository.findDetails(orderId), 'Order not found');
    if (order.studentId !== user.id) throw new HttpError(403, 'Cannot review another student order');
    if (order.status !== ORDER_STATUS.COMPLETED) throw new HttpError(400, 'Review is allowed only after completion');
    if (order.review) throw new HttpError(409, 'Review already submitted for this order');

    const updated = orderRepository.addReview({ orderId, studentId: user.id, vendorId: order.vendorId, rating, comment });
    if (!updated) throw new HttpError(500, 'Review saved but order could not be reloaded');
    realtime.orderUpdated(updated);
    return updated;
  },

  callNext(user: AuthUser, orderId?: string) {
    if (user.role !== ROLES.STAFF) throw new HttpError(403, 'Only staff can call queue numbers');
    const queue = orderRepository.listQueue();
    const candidate = orderId ? queue.find((order) => order.id === orderId) : queue.find((order) => order.status === ORDER_STATUS.READY);
    if (!candidate) throw new HttpError(404, 'No queue tickets are waiting');
    if (candidate.status === ORDER_STATUS.CALLED) return candidate;
    if (candidate.status !== ORDER_STATUS.READY) throw new HttpError(400, 'Only ready orders can be called');
    return this.updateOrderStatus(user, candidate.id, ORDER_STATUS.CALLED);
  }
};
