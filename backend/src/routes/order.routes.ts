import { Router } from 'express';
import { z } from 'zod';
import { FULFILLMENT_TYPE, ORDER_STATUS, PAYMENT_METHOD, ROLES } from '../constants/enums.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderService } from '../services/order.service.js';
import { HttpError } from '../utils/http.js';

const router = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
        customizations: z.string().optional()
      })
    )
    .min(1),
  paymentMethod: z.enum([
    PAYMENT_METHOD.TNG,
    PAYMENT_METHOD.CARD,
    PAYMENT_METHOD.ONLINE_BANKING,
    PAYMENT_METHOD.CASHLESS_WALLET
  ]),
  scheduledPickupTime: z.string().optional(),
  timeSlotId: z.string().optional(),
  fulfillmentType: z.enum([FULFILLMENT_TYPE.PICKUP, FULFILLMENT_TYPE.DELIVERY])
});

const statusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.CALLED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REJECTED
  ])
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(500)
});

router.use(requireAuth);

router.post('/', requireRole(ROLES.STUDENT), (req, res, next) => {
  try {
    const input = createOrderSchema.parse(req.body);
    res.status(201).json(orderService.createOrder(req.user!, input));
  } catch (error) {
    next(error);
  }
});

router.get('/my', requireRole(ROLES.STUDENT), (req, res) => {
  res.json({ orders: orderRepository.listByStudent(req.user!.id) });
});

router.get('/queue', requireRole(ROLES.STAFF, ROLES.VENDOR, ROLES.ADMIN), (req, res) => {
  const queue = orderRepository.listQueue();
  res.json({
    queue: req.user!.role === ROLES.VENDOR ? queue.filter((order) => order.vendorId === req.user!.vendorId) : queue
  });
});

router.get('/:id', (req, res, next) => {
  const orderId = String(req.params.id);
  const order = orderRepository.findDetails(orderId);
  if (!order) return next(new HttpError(404, 'Order not found'));

  if (req.user!.role === ROLES.STUDENT && order.studentId !== req.user!.id) {
    return next(new HttpError(403, 'Cannot access another student order'));
  }
  if (req.user!.role === ROLES.VENDOR && order.vendorId !== req.user!.vendorId) {
    return next(new HttpError(403, 'Cannot access another vendor order'));
  }

  return res.json({ order });
});

router.patch('/:id/status', (req, res, next) => {
  try {
    const input = statusSchema.parse(req.body);
    res.json({ order: orderService.updateOrderStatus(req.user!, String(req.params.id), input.status) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/review', requireRole(ROLES.STUDENT), (req, res, next) => {
  try {
    const input = reviewSchema.parse(req.body);
    res.status(201).json({ order: orderService.submitReview(req.user!, String(req.params.id), input.rating, input.comment) });
  } catch (error) {
    next(error);
  }
});

export default router;
