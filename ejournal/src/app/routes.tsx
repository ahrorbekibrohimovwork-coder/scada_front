import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { WorkPermitProvider } from './context/WorkPermitContext';
import { UserManagementProvider } from './context/UserManagementContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WorkPermitList } from './pages/WorkPermitList';
import { WorkPermitForm } from './pages/WorkPermitForm';
import { WorkPermitDetail } from './pages/WorkPermitDetail';
import { AccountManagement } from './pages/AccountManagement';
import { NotFound } from './pages/NotFound';

function RootLayout() {
  return (
    <UserManagementProvider>
      <AuthProvider>
        <WorkPermitProvider>
          <Outlet />
        </WorkPermitProvider>
      </AuthProvider>
    </UserManagementProvider>
  );
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/login',
        Component: Login,
      },
      {
        path: '/',
        Component: ProtectedRoute,
        children: [
          {
            Component: Layout,
            children: [
              { index: true, Component: () => <Navigate to="/dashboard" replace /> },
              { path: 'dashboard', Component: Dashboard },
              { path: 'permits', Component: WorkPermitList },
              { path: 'permits/new', Component: WorkPermitForm },
              { path: 'permits/:id', Component: WorkPermitDetail },
              { path: 'accounts', Component: AccountManagement },
            ],
          },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);