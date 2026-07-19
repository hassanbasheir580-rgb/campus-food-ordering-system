import { Building2, Download, KeyRound, Save, Settings, Store, UserPlus, Users, WalletCards } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../config/appConfig';
import { api } from '../services/api';
import type { AdminReport, User } from '../types/domain';

type Setting = { key: string; value: string | number | boolean; type: string; description: string };

export const AdminDashboardPage = () => {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'ALL' | User['role']>('ALL');
  const [submittingAccount, setSubmittingAccount] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState({
    outletName: '',
    name: '',
    email: '',
    phone: '',
    operatingHours: '08:00-20:00',
    location: 'Campus Food Court',
    password: 'Vendor123!'
  });
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    assignedOutlet: 'Campus Food Court',
    password: 'Staff123!'
  });
  const [passwordForm, setPasswordForm] = useState({ userId: '', password: '' });

  const loadDashboard = useCallback(() => {
    api
      .adminDashboard()
      .then((data) => {
        setReport(data.report);
        setUsers(data.users);
        setSettings(data.settings);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Admin dashboard could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const updateStatus = async (user: User, status: User['status']) => {
    try {
      await api.updateUserStatus(user.id, status);
      toast.success(`${user.name} status updated`);
      loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status could not be updated');
    }
  };

  const createVendor = async (event: FormEvent) => {
    event.preventDefault();
    setSubmittingAccount('vendor');
    try {
      await api.adminCreateVendor({
        ...vendorForm,
        name: vendorForm.name || undefined,
        phone: vendorForm.phone || undefined,
        location: vendorForm.location || undefined
      });
      toast.success('Vendor account created');
      setVendorForm((current) => ({ ...current, outletName: '', name: '', email: '', phone: '', password: 'Vendor123!' }));
      loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Vendor account could not be created');
    } finally {
      setSubmittingAccount(null);
    }
  };

  const createStaff = async (event: FormEvent) => {
    event.preventDefault();
    setSubmittingAccount('staff');
    try {
      await api.adminCreateStaff({
        ...staffForm,
        phone: staffForm.phone || undefined,
        assignedOutlet: staffForm.assignedOutlet || undefined
      });
      toast.success('Staff account created');
      setStaffForm((current) => ({ ...current, name: '', email: '', phone: '', password: 'Staff123!' }));
      loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Staff account could not be created');
    } finally {
      setSubmittingAccount(null);
    }
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    const userId = passwordForm.userId || users[0]?.id;
    if (!userId) return;
    setSubmittingAccount('password');
    try {
      await api.adminUpdatePassword(userId, passwordForm.password);
      toast.success('Password updated');
      setPasswordForm({ userId, password: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password could not be updated');
    } finally {
      setSubmittingAccount(null);
    }
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
      const result = await api.updateSettings(payload);
      setSettings(result.settings);
      toast.success('System settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Settings could not be saved');
    }
  };

  const exportCsv = async () => {
    try {
      const blob = await api.exportAdminCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'campus-food-admin-report.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  if (loading || !report) return <LoadingState />;

  const userTotal = report.users.reduce((sum, item) => sum + item.count, 0);
  const orderTotal = report.orders.reduce((sum, item) => sum + item.count, 0);
  const filteredUsers = roleFilter === 'ALL' ? users : users.filter((user) => user.role === roleFilter);

  return (
    <>
      <PageHeader eyebrow="Administration" title="Campus dining control center">
        <button className="primary-button small" onClick={exportCsv}>
          <Download size={17} />
          Export CSV
        </button>
      </PageHeader>

      <section className="stats-grid">
        <StatCard icon={Users} label="Users" value={userTotal} detail="all registered roles" />
        <StatCard icon={Store} label="Vendors" value={report.vendors.length} detail={`${orderTotal} orders tracked`} />
        <StatCard icon={WalletCards} label="Revenue" value={formatCurrency(report.payment.paidRevenue)} detail={`${report.payment.failedCount} failed payments`} />
      </section>

      <section className="account-forms" aria-label="Admin account management">
        <form className="management-form" onSubmit={createVendor}>
          <h2>
            <Building2 size={20} />
            Create vendor
          </h2>
          <div className="form-grid">
            <label>
              Outlet name
              <input
                value={vendorForm.outletName}
                onChange={(event) => setVendorForm((current) => ({ ...current, outletName: event.target.value }))}
                required
                minLength={2}
              />
            </label>
            <label>
              Contact name
              <input value={vendorForm.name} onChange={(event) => setVendorForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label>
              Email
              <input
                type="email"
                value={vendorForm.email}
                onChange={(event) => setVendorForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label>
              Phone
              <input value={vendorForm.phone} onChange={(event) => setVendorForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              Operating hours
              <input
                value={vendorForm.operatingHours}
                onChange={(event) => setVendorForm((current) => ({ ...current, operatingHours: event.target.value }))}
                required
              />
            </label>
            <label>
              Location
              <input value={vendorForm.location} onChange={(event) => setVendorForm((current) => ({ ...current, location: event.target.value }))} />
            </label>
            <label>
              Initial password
              <input
                type="password"
                value={vendorForm.password}
                onChange={(event) => setVendorForm((current) => ({ ...current, password: event.target.value }))}
                required
                minLength={8}
              />
            </label>
          </div>
          <button className="primary-button" disabled={submittingAccount === 'vendor'}>
            <UserPlus size={17} />
            {submittingAccount === 'vendor' ? 'Creating...' : 'Create vendor account'}
          </button>
        </form>

        <form className="management-form" onSubmit={createStaff}>
          <h2>
            <Users size={20} />
            Create staff
          </h2>
          <div className="form-grid">
            <label>
              Staff name
              <input
                value={staffForm.name}
                onChange={(event) => setStaffForm((current) => ({ ...current, name: event.target.value }))}
                required
                minLength={2}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={staffForm.email}
                onChange={(event) => setStaffForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label>
              Phone
              <input value={staffForm.phone} onChange={(event) => setStaffForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              Assigned outlet
              <select
                value={staffForm.assignedOutlet}
                onChange={(event) => setStaffForm((current) => ({ ...current, assignedOutlet: event.target.value }))}
              >
                <option value="Campus Food Court">Campus Food Court</option>
                {report.vendors.map((vendor) => (
                  <option value={vendor.outletName} key={vendor.id}>
                    {vendor.outletName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Initial password
              <input
                type="password"
                value={staffForm.password}
                onChange={(event) => setStaffForm((current) => ({ ...current, password: event.target.value }))}
                required
                minLength={8}
              />
            </label>
          </div>
          <button className="primary-button" disabled={submittingAccount === 'staff'}>
            <UserPlus size={17} />
            {submittingAccount === 'staff' ? 'Creating...' : 'Create staff account'}
          </button>
        </form>

        <form className="management-form" onSubmit={updatePassword}>
          <h2>
            <KeyRound size={20} />
            Reset password
          </h2>
          <label>
            User
            <select
              value={passwordForm.userId || users[0]?.id || ''}
              onChange={(event) => setPasswordForm((current) => ({ ...current, userId: event.target.value }))}
            >
              {users.map((user) => (
                <option value={user.id} key={user.id}>
                  {user.name} - {user.role}
                </option>
              ))}
            </select>
          </label>
          <label>
            New password
            <input
              type="password"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
              required
              minLength={8}
            />
          </label>
          <button className="ghost-button" disabled={submittingAccount === 'password'}>
            <KeyRound size={17} />
            {submittingAccount === 'password' ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="split-section" id="reports">
        <div className="chart-panel">
          <div className="section-heading">
            <h2>Revenue by category</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.categoryRevenue}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-panel">
          <div className="section-heading">
            <h2>Orders by status</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.orders}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="management-table" id="users">
        <div className="section-heading">
          <h2>User and vendor management</h2>
          <div className="role-filter">
            <span>{filteredUsers.length} records</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'ALL' | User['role'])}>
              <option value="ALL">All roles</option>
              <option value="STUDENT">Students</option>
              <option value="VENDOR">Vendors</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Profile</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </td>
                <td>{user.role}</td>
                <td>{user.profileLabel}</td>
                <td>
                  <StatusBadge value={user.status} />
                </td>
                <td>
                  <select
                    value={user.status}
                    onChange={(event) => updateStatus(user, event.target.value as User['status'])}
                    disabled={user.role === 'ADMIN'}
                    title={user.role === 'ADMIN' ? 'The seeded admin account is protected' : undefined}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <form className="management-form full-width" id="settings" onSubmit={saveSettings}>
        <h2>
          <Settings size={20} />
          System configuration
        </h2>
        <div className="settings-grid">
          {settings.map((setting) => (
            <label key={setting.key}>
              {setting.key}
              <input
                value={String(setting.value)}
                onChange={(event) =>
                  setSettings((current) =>
                    current.map((item) => (item.key === setting.key ? { ...item, value: event.target.value } : item))
                  )
                }
              />
              <small>{setting.description}</small>
            </label>
          ))}
        </div>
        <button className="primary-button">
          <Save size={17} />
          Save settings
        </button>
      </form>
    </>
  );
};
