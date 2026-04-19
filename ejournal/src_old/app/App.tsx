import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { WorkPermitProvider } from './context/WorkPermitContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <WorkPermitProvider>
        <RouterProvider router={router} />
      </WorkPermitProvider>
    </AuthProvider>
  );
}
