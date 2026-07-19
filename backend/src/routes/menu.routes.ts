import { Router } from 'express';
import { menuRepository } from '../repositories/menu.repository.js';
import { userRepository } from '../repositories/user.repository.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ items: menuRepository.listPublic(), vendors: userRepository.listVendors() });
});

router.get('/time-slots', (req, res) => {
  const vendorId = typeof req.query.vendorId === 'string' ? req.query.vendorId : undefined;
  res.json({ timeSlots: menuRepository.listTimeSlots(vendorId) });
});

export default router;
