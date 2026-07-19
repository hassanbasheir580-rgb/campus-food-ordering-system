# Test Plan

## Strategy
- Backend scenario tests: role login, restricted registration, student order/payment, vendor queue/status, staff call/complete, review rules, admin-created accounts, suspension/password reset, role API blocking, and payment failure.
- Frontend type check: `tsc -b`.
- Full build: backend TypeScript build and frontend Vite build.
- Visual verification: Playwright screenshots for all required screens.
- Manual acceptance: validate role workflows and status transitions.

## Acceptance Tests
| Module | Test | Expected Result |
|---|---|---|
| Student | Login, browse menu, add to cart, checkout, track, review | Student can complete the ordering workflow and review only completed orders. |
| Vendor | Accept/reject orders, mark ready, manage menu, view analytics | Vendor sees own outlet data and valid state transitions only. |
| Admin | Create vendor/staff, activate/suspend accounts, manage settings, reports, export CSV | Admin can control accounts, configuration, and reports while the seeded admin remains protected. |
| Staff | Call ready queue ticket and confirm called pickup | Queue number is called, public display updates, and only called orders can be completed. |
| Integration | Order updates across dashboards | Dashboards refresh through API and Socket.IO events. |

## Test Data
Seed data includes demo users, two vendors, seven menu items, sample orders, payments, queue tickets, reviews, time slots, and settings.
