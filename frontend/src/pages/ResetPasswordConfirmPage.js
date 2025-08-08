import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../services/api';

const ResetPasswordConfirmPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    const handleSubmit = async (values) => {
        if (values.password !== values.confirmPassword) {
            message.error('Passwords do not match');
            return;
        }

        if (!token) {
            message.error('Invalid or missing reset token.');
            return;
        }

        try {
            setLoading(true);
            await api.resetPassword(token, values.password);
            message.success('Password reset successfully! You can now sign in.');
            navigate('/auth');
        } catch (err) {
            console.error('Reset password failed:', err);
            message.error(err.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, borderRadius: 8, boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center' }}>Set New Password</h2>

            <Form layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    label="New Password"
                    name="password"
                    rules={[
                        { required: true, message: 'Please enter your new password!' },
                        { min: 8, message: 'Password must be at least 8 characters long.' },
                        {
                            pattern: /[A-Z]/,
                            message: 'Password must contain at least one uppercase letter.',
                        },
                        {
                            pattern: /[a-z]/,
                            message: 'Password must contain at least one lowercase letter.',
                        },
                        {
                            pattern: /[0-9]/,
                            message: 'Password must contain at least one number.',
                        },
                        {
                            pattern: /[\W_]/, // Matches any non-word character (symbols) or underscore
                            message: 'Password must contain at least one symbol.',
                        },
                    ]}
                    hasFeedback // Provides feedback icons based on validation status
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    label="Confirm New Password"
                    name="confirmPassword"
                    dependencies={['password']}
                    hasFeedback
                    rules={[
                        { required: true, message: 'Please confirm your new password!' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                return Promise.reject(new Error('The two passwords that you entered do not match!'));
                            }, }),
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Reset Password
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default ResetPasswordConfirmPage;
