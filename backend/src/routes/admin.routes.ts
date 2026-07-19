import { Router } from 'express';
import { z } from 'zod';
import { ROLES, USER_STATUS } from '../constants/enums.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { analyticsService } from '../services/analytics.service.js';
import { authService } from '../services/auth.service.js';
import { HttpError } from '../utils/http.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

const userStatusSchema = z.enum([USER_STATUS.ACTIVE, USER_STATUS.PENDING, USER_STATUS.SUSPENDED]);

const createVendorSchema = z.object({
  outletName: z.string().min(2),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  operatingHours: z.string().min(3),
  location: z.string().optional(),
  password: z.string().min(8),
  status: userStatusSchema.optional()
}).strict();

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  assignedOutlet: z.string().optional(),
  password: z.string().min(8),
  status: userStatusSchema.optional()
}).strict();

router.get('/dashboard', (_req, res) => {
  res.json({
    report: analyticsService.adminReport(),
    users: userRepository.listUsers(),
    settings: settingsRepository.list()
  });
});

router.get('/users', (_req, res) => {
  res.json({ users: userRepository.listUsers() });
});

router.post('/vendors', async (req, res, next) => {
  try {
    const input = createVendorSchema.parse(req.body);
    res.status(201).json({ user: await authService.createVendorAccount(input) });
  } catch (error) {
    next(error);
  }
});

router.post('/staff', async (req, res, next) => {
  try {
    const input = createStaffSchema.parse(req.body);
    res.status(201).json({ user: await authService.createStaffAccount(input) });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', (req, res, next) => {
  try {
    const input = z.object({ status: userStatusSchema }).parse(req.body);
    const existing = userRepository.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'User not found');
    if (existing.role === ROLES.ADMIN && input.status !== USER_STATUS.ACTIVE && userRepository.countActiveAdmins() <= 1) {
      throw new HttpError(400, 'The only active admin account cannot be suspended or deactivated');
    }

    const user = userRepository.updateStatus(req.params.id, input.status);
    if (!user) throw new HttpError(404, 'User not found');
    if (existing.role === ROLES.VENDOR) {
      userRepository.updateVendorVerificationByUserId(
        existing.id,
        input.status === USER_STATUS.ACTIVE ? 'APPROVED' : input.status
      );
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/password', async (req, res, next) => {
  try {
    const input = z.object({ password: z.string().min(8) }).parse(req.body);
    res.json({ user: await authService.updatePassword(req.params.id, input.password) });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', (_req, res) => {
  res.json({ settings: settingsRepository.list() });
});

router.put('/settings', (req, res, next) => {
  try {
    const input = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).parse(req.body);
    res.json({ settings: settingsRepository.updateFromRecord(input) });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', (_req, res) => {
  res.json({ report: analyticsService.adminReport() });
});

router.get('/reports/export.csv', (_req, res) => {
  res.header('Content-Type', 'text/csv');
  res.attachment('campus-food-admin-report.csv');
  res.send(analyticsService.adminReportCsv());
});

export default router;
