import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CropDetail from './components/CropDetail';
import PublicCropDetail from './components/public_page/PublicCropDetail';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;
  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/crop/:id" element={<CropDetail publicMode={false} />} />
        <Route path="/public/crop/:id" element={<PublicCropDetail />} /> {/* Public page for QR code */}
        <Route path="/test" element={<PublicCropDetailTest />} /> {/* Test page with dummy data */}
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);