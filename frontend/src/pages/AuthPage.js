import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // 注意引入 Link
import { useAuth } from '../hooks/useAuth';

const SignInPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || '/';

    const onSignIn = async ({ email, password }) => {
        setLoading(true);
        const success = await login(email, password);
        setLoading(false);
        if (success) {
            message.success('Signed in successfully!');
            navigate(from, { replace: true });
        } else {
            message.error('Invalid email or password');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, borderRadius: 8, boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center' }}>Sign In</h2>

            <Form layout="vertical" onFinish={onSignIn}>
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: 'Please enter your email' }]}
                >
                    <Input placeholder="you@example.com" />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password' }]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Sign In
                    </Button>
                </Form.Item>
            </Form>

            {/* Forgot password link */}
            <div style={{ textAlign: 'center' }}>
                <Link to="/reset-password">Reset password</Link>
            </div>
        </div>
    );
};

export default SignInPage;
