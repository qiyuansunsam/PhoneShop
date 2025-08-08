import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AdminPrivateRoute from './components/AdminPrivateRoute'; // Import AdminPrivateRoute
import TopBar from './components/TopBar';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import NotFoundPage from './pages/NotFoundPage';
import './styles/App.css';

function App() {
  const location = useLocation();
  const showTopBar = (!location.pathname.startsWith('/admin'));

  return (
    <div className="App">
      {showTopBar && <TopBar />}
      <main>
        <Routes>
           {}
          <Route path="/" element={<MainPage />} />
          <Route path="/search" element={<MainPage />} />
          <Route path="/item/:itemId" element={<MainPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordConfirmPage />} />

          <Route path="/admin" element={<AdminLoginPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/profile/*" element={<ProfilePage />} />
          </Route>
          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} /> {}
        </Routes>
      </main>
    </div>
  );
}

export default App;
