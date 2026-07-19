import { BarChart3, ClipboardList, LayoutDashboard, Settings, ShoppingBag, TicketCheck, Users } from 'lucide-react';

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Campus Food Ordering',
apiUrl: import.meta.env.VITE_API_URL ?? 'https://campus-food-ordering-system-wsra.onrender.com/api',
socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'https://campus-food-ordering-system-wsra.onrender.com',
  queueRefreshMs: numberFromEnv(import.meta.env.VITE_QUEUE_REFRESH_MS, 8000),
  currency: 'RM',
  featureFlags: {
    mockPayment: true,
    realtimeQueue: true,
    reportExport: true
  },
  nav: {
    student: [
      { label: 'Menu', path: '/student', icon: ShoppingBag },
      { label: 'Cart', path: '/student/cart', icon: ClipboardList },
      { label: 'Track', path: '/student/track', icon: TicketCheck }
    ],
    vendor: [{ label: 'Vendor Dashboard', path: '/vendor', icon: LayoutDashboard }],
    admin: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Users', path: '/admin#users', icon: Users },
      { label: 'Reports', path: '/admin#reports', icon: BarChart3 },
      { label: 'Settings', path: '/admin#settings', icon: Settings }
    ],
    staff: [{ label: 'Queue Panel', path: '/staff', icon: TicketCheck }]
  }
} as const;

export const formatCurrency = (value: number) => `${appConfig.currency} ${value.toFixed(2)}`;
