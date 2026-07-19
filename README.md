# Campus Food Ordering and Management System

Part III working prototype and documentation for the Software Design / Software Engineering project.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: SQLite through Node's maintained `node:sqlite` module
- Real-time updates: Socket.IO
- Charts: Recharts
- Validation/security: Zod, bcryptjs, JWT, helmet, cors
- Visual QA/docs: Playwright, Mermaid, python-docx, ReportLab

## Setup

```bash
npm install
npm run seed
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health

## Demo Accounts

Login uses email and password only. The backend reads the role from the database and redirects to the correct dashboard.

| Role | Email | Password |
|---|---|---|
| Student | student@campus.test | Student123! |
| Vendor | vendor@campus.test | endor123! |
| Admin | admin@campus.test | Admin123! |
| Staff | staff@campus.test | Staff123! |

Public registration is limited to student/customer accounts. Vendor and staff accounts are created by the admin dashboard or by the seed script. The seeded admin account is protected from suspension.

## Scripts

```bash
npm run seed      # reset and seed SQLite demo data
npm run dev       # run backend and frontend together
npm run build     # compile backend and frontend
npm run test      # backend smoke test + frontend type check
npm run docs      # generate Part III DOCX/PDF/Markdown outputs
```

Additional artifact scripts:

```bash
node scripts/render_mermaid.mjs
node scripts/capture_screenshots.mjs
python scripts/build_part_iii_docs.py
```

## Main Features

- Student: email/password login, student/customer registration, menu browse, cart, schedule pickup, mock payment, queue tracking, completed-order review.
- Vendor: menu/inventory management, order queue, accept/reject, preparing/ready status updates, sales analytics.
- Admin: create vendor and staff accounts, activate/suspend accounts, system configuration, reports, CSV export.
- Staff: queue panel, call ready queue numbers, confirm called pickup/delivery.
- Public queue display: real backend queue data showing the latest ready/called queue number, order ID, outlet, status, pickup message, and last updated time.

## Generated Outputs

- `docs/generated/Part_III_System_Documentation.docx`
- `docs/generated/Part_III_System_Documentation.pdf`
- `docs/generated/implementation_summary.md`
- `docs/generated/test_plan.md`
- `docs/generated/user_guide.md`
- `docs/screenshots/*.png`
- `docs/diagrams/*.mmd` and `docs/diagrams/*.png`

## Notes

- Business data is seeded in `backend/src/database/seed.ts`, not hard-coded inside React components.
- API URLs, ports, app name, database path, mock payment rate, and queue prefix are environment-configurable.
- Public queue refresh timing is configurable with `VITE_QUEUE_REFRESH_MS`.
- `npm run test` runs backend scenario coverage for student, vendor, staff, admin, review, payment failure, and role-security flows plus frontend type checking.
- The local prototype uses mock payment and local JWT login instead of real payment gateway/campus SSO.
- DOCX visual rendering requires LibreOffice/`soffice`; it was not available on this machine. The PDF artifact is generated separately with ReportLab.
