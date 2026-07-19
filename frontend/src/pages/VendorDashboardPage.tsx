import { BarChart3, CheckCircle2, ClipboardList, PackageOpen, Plus, Save, Star, Trash2, UtensilsCrossed, XCircle } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../config/appConfig';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { api } from '../services/api';
import type { MenuItem, Order, VendorAnalytics } from '../types/domain';

type MenuForm = {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  prepTime: number;
  stock: number;
  isAvailable: boolean;
  imageUrl: string;
};

const emptyMenuForm: MenuForm = {
  name: '',
  description: '',
  price: 0,
  category: '',
  prepTime: 8,
  stock: 10,
  isAvailable: true,
  imageUrl: ''
};

export const VendorDashboardPage = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<MenuForm>(emptyMenuForm);

  const loadDashboard = useCallback(() => {
    api
      .vendorDashboard()
      .then((data) => {
        setMenu(data.menu);
        setOrders(data.orders);
        setAnalytics(data.analytics);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Vendor dashboard could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useLiveRefresh(loadDashboard);

  const saveMenu = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.saveMenuItem(form);
      toast.success(form.id ? 'Menu item updated' : 'Menu item created');
      setForm(emptyMenuForm);
      loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Menu item could not be saved');
    }
  };

  const editMenu = (item: MenuItem) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      prepTime: item.prepTime,
      stock: item.stock,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl
    });
  };

  const deleteItem = async (item: MenuItem) => {
    try {
      await api.deleteMenuItem(item.id);
      toast.success(`${item.name} deleted`);
      loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Menu item could not be deleted');
    }
  };

  const updateOrder = async (order: Order, action: 'accept' | 'reject' | 'ready') => {
    try {
      if (action === 'accept') await api.vendorAcceptOrder(order.id);
      if (action === 'reject') await api.vendorRejectOrder(order.id);
      if (action === 'ready') await api.vendorUpdateStatus(order.id, 'READY');
      toast.success('Order updated');
      loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Order could not be updated');
    }
  };

  if (loading || !analytics) return <LoadingState />;

  const activeOrders = orders.filter((order) => ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status));

  return (
    <>
      <PageHeader eyebrow="Vendor Management" title="Orders, inventory, and sales" />
      <section className="stats-grid">
        <StatCard icon={ClipboardList} label="Total orders" value={analytics.summary.totalOrders} detail="all seeded and live orders" />
        <StatCard icon={BarChart3} label="Revenue" value={formatCurrency(analytics.summary.totalRevenue)} detail="paid mock transactions" />
        <StatCard icon={Star} label="Rating" value={analytics.summary.averageRating.toFixed(2)} detail="average completed reviews" />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Live order queue</h2>
          <span>{activeOrders.length} active</span>
        </div>
        {activeOrders.length === 0 ? (
          <EmptyState icon={PackageOpen} title="No active orders" message="Incoming paid student orders will appear here." />
        ) : (
          <div className="order-kanban">
            {activeOrders.map((order) => (
              <article className="queue-card" key={order.id}>
                <div>
                  <span>{order.studentName}</span>
                  <StatusBadge value={order.status} />
                </div>
                <h3>{order.queueTicket?.queueNumber ?? order.id.slice(0, 6).toUpperCase()}</h3>
                <p>{order.items.map((item) => `${item.quantity}x ${item.menuName}`).join(', ')}</p>
                <strong>{formatCurrency(order.totalPrice)}</strong>
                <div className="button-row">
                  {order.status === 'CONFIRMED' ? (
                    <>
                      <button className="primary-button small" onClick={() => updateOrder(order, 'accept')}>
                        <CheckCircle2 size={16} />
                        Accept
                      </button>
                      <button className="ghost-button danger" onClick={() => updateOrder(order, 'reject')}>
                        <XCircle size={16} />
                        Reject
                      </button>
                    </>
                  ) : null}
                  {order.status === 'PREPARING' ? (
                    <button className="primary-button small" onClick={() => updateOrder(order, 'ready')}>
                      <CheckCircle2 size={16} />
                      Ready
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="split-section">
        <form className="management-form" onSubmit={saveMenu}>
          <h2>
            <Plus size={20} />
            {form.id ? 'Edit menu item' : 'Add menu item'}
          </h2>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </label>
          <div className="form-grid">
            <label>
              Category
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
            </label>
            <label>
              Price
              <input type="number" min="0.1" step="0.1" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} required />
            </label>
            <label>
              Prep minutes
              <input type="number" min="1" value={form.prepTime} onChange={(event) => setForm({ ...form, prepTime: Number(event.target.value) })} required />
            </label>
            <label>
              Stock
              <input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} required />
            </label>
          </div>
          <label>
            Image URL
            <input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} required />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} />
            Available to students
          </label>
          <button className="primary-button">
            <Save size={17} />
            Save menu item
          </button>
        </form>

        <div className="management-table">
          <div className="section-heading">
            <h2>Menu and inventory</h2>
            <span>{menu.length} items</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menu.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.category}</span>
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{item.stock}</td>
                  <td>
                    <StatusBadge value={item.isAvailable ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="ghost-button small" onClick={() => editMenu(item)}>
                        Edit
                      </button>
                      <button className="icon-button danger" onClick={() => deleteItem(item)} aria-label={`Delete ${item.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>
            <UtensilsCrossed size={20} />
            Sales analytics
          </h2>
        </div>
        <div className="chart-panel">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.topItems}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
};
