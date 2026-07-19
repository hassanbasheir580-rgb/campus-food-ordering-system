import { randomUUID } from 'node:crypto';
import { getDb } from '../database/connection.js';
import { ROLES, USER_STATUS, type Role, type UserStatus } from '../constants/enums.js';
import type { AuthUser, User, UserWithPassword, Vendor } from '../types/domain.js';
import { nowIso } from '../utils/http.js';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

type VendorRow = {
  id: string;
  user_id: string;
  outlet_name: string;
  operating_hours: string;
  avg_rating: number;
  verification_status: string;
  location: string;
};

const mapUser = (row: UserRow): UserWithPassword => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  phone: row.phone,
  role: row.role,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const withoutPassword = (user: UserWithPassword): User => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

const mapVendor = (row: VendorRow): Vendor => ({
  id: row.id,
  userId: row.user_id,
  outletName: row.outlet_name,
  operatingHours: row.operating_hours,
  avgRating: row.avg_rating,
  verificationStatus: row.verification_status,
  location: row.location
});

export const userRepository = {
  createBaseUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
    role: Role;
    status?: UserStatus;
  }) {
    const db = getDb();
    const id = randomUUID();
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, phone, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.name,
      input.email.toLowerCase(),
      input.passwordHash,
      input.phone ?? null,
      input.role,
      input.status ?? USER_STATUS.ACTIVE,
      timestamp,
      timestamp
    );

    return this.findById(id)!;
  },

  createStudentProfile(userId: string, input: { studentNo: string; faculty: string; department: string; dietaryPreferences?: string }) {
    getDb()
      .prepare(
        `INSERT INTO students (user_id, student_no, faculty, department, dietary_preferences)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(userId, input.studentNo, input.faculty, input.department, input.dietaryPreferences ?? null);
  },

  createVendorProfile(userId: string, input: { outletName: string; operatingHours: string; location: string; verificationStatus?: string }) {
    const id = randomUUID();
    getDb()
      .prepare(
        `INSERT INTO vendors (id, user_id, outlet_name, operating_hours, location, verification_status)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, userId, input.outletName, input.operatingHours, input.location, input.verificationStatus ?? 'APPROVED');
    return id;
  },

  createAdminProfile(userId: string, input: { adminLevel: string; department: string; accessPermissions: string }) {
    getDb()
      .prepare(
        `INSERT INTO admins (user_id, admin_level, department, access_permissions)
         VALUES (?, ?, ?, ?)`
      )
      .run(userId, input.adminLevel, input.department, input.accessPermissions);
  },

  createStaffProfile(userId: string, input: { assignedOutlet: string; permissions: string }) {
    getDb()
      .prepare(
        `INSERT INTO staff (user_id, assigned_outlet, permissions)
         VALUES (?, ?, ?)`
      )
      .run(userId, input.assignedOutlet, input.permissions);
  },

  findByEmail(email: string) {
    const row = getDb()
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as UserRow | undefined;
    return row ? mapUser(row) : null;
  },

  findById(id: string) {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? mapUser(row) : null;
  },

  findSafeById(id: string) {
    const user = this.findById(id);
    return user ? withoutPassword(user) : null;
  },

  findAuthUserById(id: string): AuthUser | null {
    const user = this.findById(id);
    if (!user) return null;
    const safe = withoutPassword(user);
    if (safe.role === ROLES.VENDOR) {
      const vendor = this.findVendorByUserId(safe.id);
      return vendor ? { ...safe, vendorId: vendor.id } : safe;
    }
    return safe;
  },

  findVendorByUserId(userId: string) {
    const row = getDb()
      .prepare('SELECT * FROM vendors WHERE user_id = ?')
      .get(userId) as VendorRow | undefined;
    return row ? mapVendor(row) : null;
  },

  findVendorById(vendorId: string) {
    const row = getDb().prepare('SELECT * FROM vendors WHERE id = ?').get(vendorId) as VendorRow | undefined;
    return row ? mapVendor(row) : null;
  },

  updateVendorVerificationByUserId(userId: string, verificationStatus: string) {
    getDb()
      .prepare('UPDATE vendors SET verification_status = ? WHERE user_id = ?')
      .run(verificationStatus, userId);
  },

  listVendors() {
    const rows = getDb()
      .prepare('SELECT * FROM vendors ORDER BY outlet_name')
      .all() as VendorRow[];
    return rows.map(mapVendor);
  },

  listUsers() {
    const rows = getDb()
      .prepare(
        `SELECT u.*, v.outlet_name, s.student_no, st.assigned_outlet
         FROM users u
         LEFT JOIN vendors v ON v.user_id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         LEFT JOIN staff st ON st.user_id = u.id
         ORDER BY u.role, u.name`
      )
      .all() as Array<UserRow & { outlet_name?: string; student_no?: string; assigned_outlet?: string }>;

    return rows.map((row) => ({
      ...withoutPassword(mapUser(row)),
      profileLabel: row.outlet_name ?? row.student_no ?? row.assigned_outlet ?? 'Campus operations'
    }));
  },

  updateStatus(id: string, status: UserStatus) {
    getDb()
      .prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, nowIso(), id);
    return this.findSafeById(id);
  },

  updatePassword(id: string, passwordHash: string) {
    getDb()
      .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(passwordHash, nowIso(), id);
    return this.findSafeById(id);
  },

  countActiveAdmins() {
    const row = getDb()
      .prepare('SELECT COUNT(*) AS count FROM users WHERE role = ? AND status = ?')
      .get(ROLES.ADMIN, USER_STATUS.ACTIVE) as { count: number };
    return row.count;
  }
};
