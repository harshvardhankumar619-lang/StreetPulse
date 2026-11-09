import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import theme from './theme';
import { AuthProvider } from './lib/auth';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ReportPage from './pages/ReportPage';
import DashboardPage from './pages/DashboardPage';
import MyReportsPage from './pages/MyReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import SuccessPage from './pages/SuccessPage';
import AccountPage from './pages/AccountPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminReportDetailPage from './pages/AdminReportDetailPage';
import AdminMapPage from './pages/AdminMapPage';
import AdminProfilePage from './pages/AdminProfilePage';

function ReportRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/reports/${id}`} replace />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/success/:id" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
            <Route path="/reports/:id" element={<ProtectedRoute><ReportDetailPage /></ProtectedRoute>} />
            <Route path="/my-reports" element={<Navigate to="/reports" replace />} />
            <Route path="/my-reports/:id" element={<ReportRedirect />} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/profile" element={<Navigate to="/account" replace />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
            <Route path="/admin/reports/:id" element={<AdminRoute><AdminReportDetailPage /></AdminRoute>} />
            <Route path="/admin/map" element={<AdminRoute><AdminMapPage /></AdminRoute>} />
            <Route path="/admin/profile" element={<AdminRoute><AdminProfilePage /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
