import type { NextFunction, Request, Response } from 'express';
import { type Role } from '../constants/enums.js';
import { authService } from '../services/auth.service.js';
import { HttpError } from '../utils/http.js';

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return next(new HttpError(401, 'Authentication required'));

  const user = authService.verify(token);
  if (!user) return next(new HttpError(401, 'Invalid or expired session'));

  req.user = user;
  next();
};

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Role is not allowed for this action'));
    next();
  };
