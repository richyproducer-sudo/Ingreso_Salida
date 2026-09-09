import { Routes, Route, Navigate } from 'react-router-dom';
import KioskPage from './pages/KioskPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import DashboardHome from './pages/admin/DashboardHome.jsx';
import EmployeesPage from './pages/admin/EmployeesPage.jsx';
import RecordsPage from './pages/admin/RecordsPage.jsx';
import { useAuth } from './lib/AuthContext.jsx';

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<KioskPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="records" element={<RecordsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
