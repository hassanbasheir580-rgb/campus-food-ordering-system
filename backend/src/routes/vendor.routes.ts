import { Router } from 'express';
import { z } from 'zod';
import { ORDER_STATUS, ROLES } from '../constants/enums.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { menuRepository } from '../repositories/menu.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { analyticsService } from '../services/analytics.service.js';
import { orderService } from '../services/order.service.js';
import { HttpError } from '../utils/http.js';

const router = Router();

const menuSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  category: z.string().min(2),
  prepTime: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
  imageUrl: z.string().min(1)
});

router.use(requireAuth, requireRole(ROLES.VENDOR));

router.get('/dashboard', (req, res) => {
  const vendorId = req.user!.vendorId!;
  res.json({
    menu: menuRepository.listByVendor(vendorId),
    orders: orderRepository.listByVendor(vendorId),
    analytics: analyticsService.vendorAnalytics(vendorId)
  });
});

router.get('/menu', (req, res) => {
  res.json({ items: menuRepository.listByVendor(req.user!.vendorId!) });
});

router.post('/menu', (req, res, next) => {
  try {
    const input = menuSchema.parse(req.body);
    res.status(201).json({ item: menuRepository.create(req.user!.vendorId!, input) });
  } catch (error) {
    next(error);
  }
});

router.patch('/menu/:id', (req, res, next) => {
  try {
    const current = menuRepository.findById(req.params.id);
    if (!current) throw new HttpError(404, 'Menu item not found');
    if (current.vendorId !== req.user!.vendorId) throw new HttpError(403, 'Cannot edit another vendor item');
    const input = menuSchema.partial().parse(req.body);
    res.json({ item: menuRepository.update(req.params.id, input) });
  } catch (error) {
    next(error);
  }
});

router.delete('/menu/:id', (req, res, next) => {
  try {
    const current = menuRepository.findById(req.params.id);
    if (!current) throw new HttpError(404, 'Menu item not found');
    if (current.vendorId !== req.user!.vendorId) throw new HttpError(403, 'Cannot delete another vendor item');
    menuRepository.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/orders', (req, res) => {
  res.json({ orders: orderRepository.listByVendor(req.user!.vendorId!) });
});

router.post('/orders/:id/accept', (req, res, next) => {
  try {
    res.json({ order: orderService.updateOrderStatus(req.user!, req.params.id, ORDER_STATUS.PREPARING) });
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:id/reject', (req, res, next) => {
  try {
    res.json({ order: orderService.updateOrderStatus(req.user!, req.params.id, ORDER_STATUS.REJECTED) });
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/status', (req, res, next) => {
  try {
    const input = z.object({ status: z.enum([ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.CANCELLED]) }).parse(req.body);
    res.json({ order: orderService.updateOrderStatus(req.user!, req.params.id, input.status) });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics', (req, res) => {
  res.json(analyticsService.vendorAnalytics(req.user!.vendorId!));
});

export default router;
