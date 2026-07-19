import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { roleHomePath } from '../constants/status';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/domain';
import { LoadingState } from './LoadingState';

export const ProtectedRoute = ({ role, children }: { role: Role; children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={roleHomePath[user.role]} replace />;
  return <>{children}</>;
};
