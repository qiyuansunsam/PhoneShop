// pages/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import { Menu, message, Spin, Modal } from 'antd'; // Import Modal
import { useNavigate } from 'react-router-dom';
import UserManagement from './AdminUserManagementPage';
import ListingManagement from './AdminListingManagementPage';
import ReviewModeration from './AdminReviewModerationPage';
import SalesLog from './AdminSalesLogPage';
import { adminLogout, checkAdminSession, fetchSalesLogs } from '../services/api'; // Import adminLogout, checkAdminSession, and fetchSalesLogs

const AdminDashboardPage = () => {
    const [selectedKey, setSelectedKey] = useState('users');
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [lastSalesLogCount, setLastSalesLogCount] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const verifySession = async () => {
            try {
                await checkAdminSession();
            } catch (err) {
                console.error('Admin session check failed:', err);
                message.error(err.message || 'Your session has expired. Please log in again.');
                navigate('/admin');
            } finally {
                setIsLoadingSession(false);
            }
        };

        verifySession();
    }, [navigate]);

    // useEffect for polling new orders
    useEffect(() => {
        let isMounted = true; // To prevent state updates on unmounted component

        const checkForNewOrders = async () => {
            if (!isMounted) return;

            try {
                const data = await fetchSalesLogs();
                const currentLogs = Array.isArray(data?.salesLogs) ? data.salesLogs : [];
                const currentLogCount = currentLogs.length;

                if (isMounted) {
                    if (lastSalesLogCount !== null && currentLogCount > lastSalesLogCount) {
                        const newOrdersCount = currentLogCount - lastSalesLogCount;
                        message.info(`${newOrdersCount} new order(s) placed! Check Sales Logs.`);
                    }
                    setLastSalesLogCount(currentLogCount);
                }
            } catch (error) {
                console.warn('Background check for new orders failed:', error.message);
            }
        };

        checkForNewOrders(); // Initial check
        const intervalId = setInterval(checkForNewOrders, 1000); // Check every 10 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [lastSalesLogCount]); // Rerun effect if lastSalesLogCount changes to ensure correct comparison logic

    const handleLogout = async () => {
        try {
            const response = await adminLogout();
            message.success(response.message || 'Logged out successfully.');
            navigate('/admin');
        } catch (err) {
            console.error('Admin logout failed:', err);
            message.error(err.message || 'Logout failed. Please try again.');
        }
    };

    const showLogoutConfirm = () => {
        Modal.confirm({
            title: 'Confirm Logout',
            content: 'Are you sure you want to logout?',
            okText: 'Logout',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
                handleLogout();
            },
            onCancel() {
                // Optional: console.log('Logout cancelled');
            },
        });
    };
    const renderContent = () => {
        switch (selectedKey) {
            case 'users':
                return <UserManagement />;
            case 'listings':
                return <ListingManagement />;
            case 'reviews':
                return <ReviewModeration />;
            case 'logs':
                return <SalesLog />;
            default:
                return <div>Select a module</div>;
        }
    };

    if (isLoadingSession) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Verifying session..." />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Menu
                mode="vertical"
                style={{ width: 200 }}
                selectedKeys={[selectedKey]}
                onClick={(e) => {
                    if (e.key === 'logout') {
                        showLogoutConfirm(); // Show confirmation dialog
                    } else {
                        setSelectedKey(e.key);
                    }
                }}
                items={[
                    { key: 'users', label: 'User Management' },
                    { key: 'listings', label: 'Listing Management' },
                    { key: 'reviews', label: 'Review Moderation' },
                    { key: 'logs', label: 'Sales Logs' },
                    { key: 'logout', label: 'Logout', danger: true } // Added logout item
                ]}
            />
            <div style={{ flex: 1, padding: 24 }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboardPage;
