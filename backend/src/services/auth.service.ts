import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { ROLES, USER_STATUS, type Role, type UserStatus } from '../constants/enums.js';
import { userRepository } from '../repositories/user.repository.js';
import type { AuthUser } from '../types/domain.js';
import { HttpError } from '../utils/http.js';

const tokenFor = (user: AuthUser) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: '12h' });

export const authService = {
  async login(email: string, password: string) {
    const user = userRepository.findByEmail(email);
    if (!user) throw new HttpError(401, 'Invalid email or password');
    if (user.status !== USER_STATUS.ACTIVE) throw new HttpError(403, `Account is ${user.status.toLowerCase()}`);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Invalid email or password');

    const authUser = userRepository.findAuthUserById(user.id)!;
    return { user: authUser, token: tokenFor(authUser) };
  },

  async register(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    if (userRepository.findByEmail(input.email)) {
      throw new HttpError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = userRepository.createBaseUser({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE
    });

    userRepository.createStudentProfile(user.id, {
      studentNo: `STU-${randomUUID().slice(0, 6).toUpperCase()}`,
      faculty: 'Computing',
      department: 'Software Engineering',
      dietaryPreferences: 'Not specified'
    });

    const authUser = userRepository.findAuthUserById(user.id)!;
    return { user: authUser, token: tokenFor(authUser) };
  },

  async createVendorAccount(input: {
    outletName: string;
    email: string;
    password: string;
    phone?: string;
    operatingHours: string;
    name?: string;
    location?: string;
    status?: UserStatus;
  }) {
    if (userRepository.findByEmail(input.email)) {
      throw new HttpError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = userRepository.createBaseUser({
      name: input.name ?? input.outletName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: ROLES.VENDOR,
      status: input.status ?? USER_STATUS.ACTIVE
    });
    userRepository.createVendorProfile(user.id, {
      outletName: input.outletName,
      operatingHours: input.operatingHours,
      location: input.location ?? 'Campus Food Court',
      verificationStatus: input.status === USER_STATUS.SUSPENDED ? 'SUSPENDED' : 'APPROVED'
    });

    return userRepository.findAuthUserById(user.id)!;
  },

  async createStaffAccount(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    assignedOutlet?: string;
    status?: UserStatus;
  }) {
    if (userRepository.findByEmail(input.email)) {
      throw new HttpError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = userRepository.createBaseUser({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: ROLES.STAFF,
      status: input.status ?? USER_STATUS.ACTIVE
    });
    userRepository.createStaffProfile(user.id, {
      assignedOutlet: input.assignedOutlet ?? 'Campus Food Court',
      permissions: 'QUEUE_CALL,PICKUP_CONFIRM'
    });

    return userRepository.findAuthUserById(user.id)!;
  },

  async updatePassword(userId: string, password: string) {
    if (!userRepository.findById(userId)) throw new HttpError(404, 'User not found');
    const passwordHash = await bcrypt.hash(password, 10);
    return userRepository.updatePassword(userId, passwordHash);
  },

  verify(token: string) {
    try {
      const payload = jwt.verify(token, env.jwtSecret) as { sub: string; role: Role };
      const user = userRepository.findAuthUserById(payload.sub);
      if (!user || user.status !== USER_STATUS.ACTIVE) return null;
      return user;
    } catch {
      return null;
    }
  }
};
