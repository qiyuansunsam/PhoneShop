import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';

const AdminLoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        console.log("Submitted values:", values);
        try {
            setLoading(true);
            if (!values.email || !values.password) {
                throw new Error('Email and password are required.');
            }

            await adminLogin({
                email: values.email.trim(),
                password: values.password
            });

            message.success('Admin login successful');
            console.log('test')
            await navigate('/admin/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            message.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '80px auto' }}>
            <h2 style={{ textAlign: 'center' }}>Admin Login</h2>
            <Form layout="vertical" onFinish={handleLogin}>
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: "'email' is required" }]}
                >
                    <Input placeholder="Enter your email" />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: "'password' is required" }]}
                >
                    <Input.Password placeholder="Enter your password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                    Login
                </Button>
            </Form>
        </div>
    );
};

export default AdminLoginPage;
