import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../auth/ProtectedRoute';
import { useAuth } from '../auth/useAuth';

import LoginPage from '../pages/auth/LoginPage';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage';
import TicketListPage from '../pages/tickets/TicketListPage';
import CreateTicketPage from '../pages/tickets/CreateTicketPage';
import TicketDetailPage from '../pages/tickets/TicketDetailPage';
import KnowledgeBaseListPage from '../pages/knowledge-base/KnowledgeBaseListPage';
import KnowledgeBaseDetailPage from '../pages/knowledge-base/KnowledgeBaseDetailPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import CustomerDashboardPage from '../pages/dashboard/CustomerDashboardPage';
import AgentDashboardPage from '../pages/agent/AgentDashboardPage';
import AgentTicketListPage from '../pages/agent/AgentTicketListPage';
import AgentQueuePage from '../pages/agent/AgentQueuePage';
import AgentTicketDetailPage from '../pages/agent/AgentTicketDetailPage';
import ManagerDashboardPage from '../pages/manager/ManagerDashboardPage';
import ManagerTicketListPage from '../pages/manager/ManagerTicketListPage';
import ManagerReportsPage from '../pages/manager/ManagerReportsPage';
import ManagerSLAPage from '../pages/manager/ManagerSLAPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUserManagementPage from '../pages/admin/AdminUserManagementPage';
import AdminCategoryPage from '../pages/admin/AdminCategoryPage';
import AdminAuditLogPage from '../pages/admin/AdminAuditLogPage';

function getDashboardPath(roles: string[]) {
  if (roles.includes('ADMIN')) return '/admin/dashboard';
  if (roles.includes('MANAGER')) return '/manager/dashboard';
  if (roles.includes('AGENT')) return '/agent/dashboard';
  if (roles.includes('CUSTOMER')) return '/customer/dashboard';

  return '/login';
}

function RoleBasedRedirect() {
  const { isAuthenticated, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    navigate(getDashboardPath(roles), { replace: true });
  }, [isAuthenticated, loading, navigate, roles]);

  return null;
}

function LoginRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <RoleBasedRedirect />;
  }

  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <LoginRoute>
              <LoginPage />
            </LoginRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected — shared layout */}
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute requiredRole="AGENT">
                <AgentDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/tickets"
            element={
              <ProtectedRoute requiredRole="AGENT">
                <AgentTicketListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/tickets/:id"
            element={
              <ProtectedRoute requiredRole="AGENT">
                <AgentTicketDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/queue"
            element={
              <ProtectedRoute requiredRole="AGENT">
                <AgentQueuePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/knowledge-base"
            element={
              <ProtectedRoute requiredRole="AGENT">
                <KnowledgeBaseListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/knowledge-base/:id"
            element={
              <ProtectedRoute requiredRole="AGENT">
                <KnowledgeBaseDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/notifications"
            element={
              <ProtectedRoute requiredRole="AGENT">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/tickets"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerTicketListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/sla"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerSLAPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/notifications"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUserManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminCategoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminAuditLogPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/tickets"
            element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <TicketListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/tickets/new"
            element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <CreateTicketPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/tickets/:id"
            element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/knowledge-base"
            element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <KnowledgeBaseListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/knowledge-base/:id"
            element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <KnowledgeBaseDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketListPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
