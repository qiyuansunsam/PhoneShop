import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin, message } from 'antd';
import { checkAdminSession } from '../services/api';

const AdminPrivateRoute = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAdminSession = async () => {
      try {
        await checkAdminSession();
        setIsAdminAuthenticated(true);
      } catch (error) {
        console.error("Admin session check failed in AdminPrivateRoute:", error);
        setIsAdminAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminSession();
  }, [location]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)', /* Adjust height if you have a TopBar */ }}>
        <Spin size="large" tip="Verifying admin session..." />
      </div>
    );
  }

  return isAdminAuthenticated ? <Outlet /> : <Navigate to="/admin" state={{ from: location }} replace />;
};

export default AdminPrivateRoute;