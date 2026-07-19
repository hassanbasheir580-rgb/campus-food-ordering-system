# Implementation Summary

The prototype implements the Campus Food Ordering and Management System from Part I and Part II.

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: SQLite through Node's maintained built-in `node:sqlite` module
- Real-time updates: Socket.IO
- Charts: Recharts
- Validation/security: Zod, bcryptjs, jsonwebtoken, helmet, cors

## Demo Accounts
| Role | Email | Password |
|---|---|---|
| Student | student@campus.test | Student123! |
| Vendor | vendor@campus.test | Vendor123! |
| Admin | admin@campus.test | Admin123! |
| Staff | staff@campus.test | Staff123! |

## Run
```bash
npm install
npm run seed
npm run dev
```

Frontend: http://localhost:5173
Backend health: http://localhost:4000/api/health

## Verification
```bash
npm run build
npm run test
npm audit --audit-level=high
node scripts/capture_screenshots.mjs
node scripts/render_mermaid.mjs
python scripts/build_part_iii_docs.py
```

## Notes
- Login is email/password based. The backend determines the role from the database and redirects the user to the correct dashboard.
- Only student/customer self-registration is public. Vendor and staff accounts are seeded or created by admin.
- The public queue display reads `/api/queue/display` and updates from real order/queue data through Socket.IO and polling.
- Mock payment success rate is configurable in the `system_settings` table and admin dashboard.
- Business data is seeded in `backend/src/database/seed.ts`, not hard-coded in frontend pages.
- UI pages load menu, orders, users, settings, queue tickets, and analytics through backend APIs.
