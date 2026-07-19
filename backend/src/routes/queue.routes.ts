import { Router } from 'express';
import { orderRepository } from '../repositories/order.repository.js';

const router = Router();

router.get('/display', (_req, res) => {
  res.json({ current: orderRepository.publicQueueDisplay() });
});

export default router;
