import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CartPage } from './pages/CartPage';
import { LoginPage } from './pages/LoginPage';
import { StaffQueuePage } from './pages/StaffQueuePage';
import { StudentMenuPage } from './pages/StudentMenuPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';

export const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/student"
      element={
        <ProtectedRoute role="STUDENT">
          <StudentLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<StudentMenuPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="track" element={<TrackOrderPage />} />
    </Route>
    <Route
      path="/vendor"
      element={
        <ProtectedRoute role="VENDOR">
          <DashboardLayout navKey="vendor" />
        </ProtectedRoute>
      }
    >
      <Route index element={<VendorDashboardPage />} />
    </Route>
    <Route
      path="/admin"
      element={
        <ProtectedRoute role="ADMIN">
          <DashboardLayout navKey="admin" />
        </ProtectedRoute>
      }
    >
      <Route index element={<AdminDashboardPage />} />
    </Route>
    <Route
      path="/staff"
      element={
        <ProtectedRoute role="STAFF">
          <DashboardLayout navKey="staff" />
        </ProtectedRoute>
      }
    >
      <Route index element={<StaffQueuePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);
