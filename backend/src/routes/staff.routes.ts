import { Router } from 'express';
import { z } from 'zod';
import { ORDER_STATUS, ROLES } from '../constants/enums.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderService } from '../services/order.service.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.STAFF));

router.get('/queue', (_req, res) => {
  res.json({ queue: orderRepository.listQueue() });
});

router.post('/queue/call-next', (req, res, next) => {
  try {
    const input = z.object({ orderId: z.string().optional() }).parse(req.body ?? {});
    res.json({ order: orderService.callNext(req.user!, input.orderId) });
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:id/complete', (req, res, next) => {
  try {
    res.json({ order: orderService.updateOrderStatus(req.user!, req.params.id, ORDER_STATUS.COMPLETED) });
  } catch (error) {
    next(error);
  }
});

export default router;
