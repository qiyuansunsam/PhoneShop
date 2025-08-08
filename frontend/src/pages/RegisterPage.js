import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { register } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const onFinish = async (values) => {
        await register(values, navigate);
    };

    return (
        <div style={{ maxWidth: 450, margin: '60px auto', padding: 24 }}>
            <h2 style={{ textAlign: 'center' }}>Register</h2>
            <Form layout="vertical" onFinish={onFinish}>
                <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        { required: true, message: 'Please input your password!' },
                        { min: 8, message: ' must be at least 8 characters long.' },
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
                            pattern: /[\W_]/, 
                            message: 'Password must contain at least one symbol.',
                        },
                    ]}
                >
                    
                    <Input.Password />
                </Form.Item>
                <Form.Item label="Confirm Password" name="confirm" dependencies={['password']} rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) return Promise.resolve();
                            return Promise.reject(new Error('Passwords do not match'));
                        }
                    })
                ]}>
                    <Input.Password />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" block>Register</Button>
                </Form.Item>
            </Form>
        </div>
    );
};


export default RegisterPage;
