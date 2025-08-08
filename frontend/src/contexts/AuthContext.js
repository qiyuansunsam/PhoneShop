import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../services/api';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkedLogin, setCheckedLogin] = useState(false);
    useEffect(() => {
        const checkLoggedIn = async () => {
            setLoading(true);
            try {
                const res = await api.checkAuthStatus();
                if (res.userInformation) {
                    console.log(res.userInformation)
                    setUser(res.userInformation);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setUser(null);
            } finally {
                setLoading(false);
                setCheckedLogin(true);
            }
        };
        checkLoggedIn();
    }, []);

    const register = async (values, navigate) => {
        try {
            const response = await api.registerUser(values);

            if (response && response.message?.includes('created')) {
                message.success('Registration successful! Please check your email to verify your account.');
                navigate('/auth');
            } else {
                message.error(response.message || 'Registration failed');
            }
        } catch (err) {
            console.error("Register failed:", err);
            message.error(err.message || 'Registration failed');
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.loginUser({ email, password }); // 不再保存 token
            if (response.user) {
                setUser(response.user);
                return true;
            }
        } catch (err) {
            console.error('Login error:', err);
            message.error(err.message || 'Invalid email or password');
        }
        return false;
    };

    const logout = async () => {
        try {
            await api.logout();
            setUser(null);
            message.success('Logged out successfully!');
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
            message.error('Logout failed.');
        }
    };

    const value = { user, loading, login, register, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
