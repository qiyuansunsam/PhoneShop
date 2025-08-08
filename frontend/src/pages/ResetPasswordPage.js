import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { requestPasswordReset } from '../services/api'; // 记得你有这个 API 方法！

const ResetPasswordPage = () => {
    const [loading, setLoading] = useState(false);

    const handleReset = async ({ email }) => {
        setLoading(true);
        try {
            await requestPasswordReset(email);
            message.success('Password reset email sent! Please check your inbox.');
        } catch (error) {
            console.error('Reset password failed:', error);
            message.error(error.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, borderRadius: 8, boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center' }}>Reset Password</h2>

            <Form layout="vertical" onFinish={handleReset}>
                <Form.Item
                    label="Registered Email"
                    name="email"
                    rules={[{ required: true, message: 'Please enter your registered email' }]}
                >
                    <Input placeholder="you@example.com" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Send Reset Link
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default ResetPasswordPage;
