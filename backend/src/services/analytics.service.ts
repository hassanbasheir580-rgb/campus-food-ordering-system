import { getDb } from '../database/connection.js';
import { orderRepository } from '../repositories/order.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export const analyticsService = {
  vendorAnalytics(vendorId: string) {
    const db = getDb();
    const summary = db
      .prepare(
        `SELECT
          COUNT(DISTINCT o.id) AS total_orders,
          COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) AS total_revenue,
          COALESCE(AVG(r.rating), 0) AS average_rating
         FROM orders o
         LEFT JOIN payments p ON p.order_id = o.id
         LEFT JOIN reviews r ON r.order_id = o.id
         WHERE o.vendor_id = ?`
      )
      .get(vendorId) as { total_orders: number; total_revenue: number; average_rating: number };

    const topItems = db
      .prepare(
        `SELECT mi.name, SUM(oi.quantity) AS quantity, SUM(oi.subtotal) AS revenue
         FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id
         JOIN orders o ON o.id = oi.order_id
         JOIN payments p ON p.order_id = o.id
         WHERE o.vendor_id = ? AND p.status = 'PAID'
         GROUP BY mi.id, mi.name
         ORDER BY quantity DESC
         LIMIT 5`
      )
      .all(vendorId) as Array<{ name: string; quantity: number; revenue: number }>;

    const dailySales = db
      .prepare(
        `SELECT SUBSTR(o.created_at, 1, 10) AS date, COUNT(*) AS orders, COALESCE(SUM(p.amount), 0) AS revenue
         FROM orders o
         JOIN payments p ON p.order_id = o.id
         WHERE o.vendor_id = ? AND p.status = 'PAID'
         GROUP BY SUBSTR(o.created_at, 1, 10)
         ORDER BY date`
      )
      .all(vendorId) as Array<{ date: string; orders: number; revenue: number }>;

    return {
      summary: {
        totalOrders: summary.total_orders ?? 0,
        totalRevenue: Number((summary.total_revenue ?? 0).toFixed(2)),
        averageRating: Number((summary.average_rating ?? 0).toFixed(2))
      },
      topItems,
      dailySales
    };
  },

  adminReport() {
    const db = getDb();
    const userCounts = db
      .prepare('SELECT role, COUNT(*) AS count FROM users GROUP BY role')
      .all() as Array<{ role: string; count: number }>;
    const orderCounts = db
      .prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status')
      .all() as Array<{ status: string; count: number }>;
    const payment = orderRepository.paymentCounts();
    const vendors = userRepository.listVendors();
    const categoryRevenue = db
      .prepare(
        `SELECT mi.category, COALESCE(SUM(oi.subtotal), 0) AS revenue
         FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id
         JOIN payments p ON p.order_id = oi.order_id
         WHERE p.status = 'PAID'
         GROUP BY mi.category
         ORDER BY revenue DESC`
      )
      .all() as Array<{ category: string; revenue: number }>;

    return {
      users: userCounts,
      orders: orderCounts,
      vendors,
      payment: {
        paidRevenue: Number((payment.paid_revenue ?? 0).toFixed(2)),
        paidCount: payment.paid_count ?? 0,
        failedCount: payment.failed_count ?? 0
      },
      categoryRevenue
    };
  },

  adminReportCsv() {
    const report = this.adminReport();
    const lines = [
      'Section,Metric,Value',
      ...report.users.map((item) => `Users,${item.role},${item.count}`),
      ...report.orders.map((item) => `Orders,${item.status},${item.count}`),
      `Payments,Paid Revenue,${report.payment.paidRevenue}`,
      `Payments,Paid Count,${report.payment.paidCount}`,
      `Payments,Failed Count,${report.payment.failedCount}`,
      ...report.categoryRevenue.map((item) => `Category Revenue,${item.category},${item.revenue}`)
    ];
    return lines.join('\n');
  }
};
