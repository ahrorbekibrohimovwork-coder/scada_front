import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WorkPermitList } from './pages/WorkPermitList';
import { WorkPermitForm } from './pages/WorkPermitForm';
import { WorkPermitDetail } from './pages/WorkPermitDetail';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
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
        ],
      },
    ],
  },
  { path: '*', Component: NotFound },
]);
