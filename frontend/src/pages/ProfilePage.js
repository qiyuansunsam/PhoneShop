import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Tabs } from 'antd';
import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Form, Input, Button, Switch,Table, Popconfirm, Modal, message, Image, } from 'antd';
import Review from '../components/Review';
import * as api from '../services/api';
import axios from 'axios';


function EditProfile({ user, onUpdateSuccess }) {
    const [form] = Form.useForm();
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");

    const handleUpdateClick = () => {
        setConfirmModalVisible(true);
    };

    const handleConfirmUpdate = async () => {
        try {
            const values = await form.validateFields();
            const requestData = {
                currentPassword: currentPassword,
                profileData: {
                    firstname: values.firstname,
                    lastname: values.lastname,
                    email: values.email
                }
            };

            await api.updateUserProfile(requestData);

            message.success('Profile updated successfully!');
            setConfirmModalVisible(false);
            if (onUpdateSuccess) {
                onUpdateSuccess();
            }
        } catch (error) {
            console.error('Update profile failed:', error);
            message.error(error.message || 'Failed to update profile.');
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', marginTop: 32 }}>
            <Form form={form} layout="vertical" initialValues={{
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            }}>
                <Form.Item label="First Name" name="firstname" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Last Name" name="lastname" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" onClick={handleUpdateClick}>
                        Update Profile
                    </Button>
                </Form.Item>
            </Form>

            <Modal
                title="Confirm Password"
                open={confirmModalVisible}
                onOk={handleConfirmUpdate}
                onCancel={() => setConfirmModalVisible(false)}
                okText="Confirm"
                cancelText="Cancel"
            >
                <Input.Password
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />
            </Modal>
        </div>
    );
}

function ChangePassword() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            const { currentPassword, newPassword } = await form.validateFields();
            setLoading(true);

            await api.changePassword({ currentPassword, newPassword });
            message.success('Password changed successfully! Please check your email.');

            form.resetFields();
        } catch (error) {
            console.error('Change password failed:', error);
            message.error(error.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '0 auto', marginTop: 32 }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    label="Current Password"
                    name="currentPassword"
                    rules={[{ required: true, message: 'Please enter your current password' }]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    label="New Password"
                    name="newPassword"
                    rules={[
                        { required: true, message: 'Please input your new password!' },
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
                    hasFeedback
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    label="Confirm New Password"
                    name="confirmNewPassword"
                    dependencies={['newPassword']}
                    hasFeedback
                    rules={[
                        { required: true, message: 'Please confirm your new password!' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                                return Promise.reject(new Error('The two new passwords that you entered do not match!'));
                            }, }),
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Confirm Change
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

function ManageListings({ user }) {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchListings = async () => {
        try {
            setLoading(true);
            const response = await api.getAllListings();
            console.log('Raw API response:', response);

            const data = response?.phonelists || [];
            console.log('Processed listings data:', data);

            setListings(data);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
            message.error('Failed to load listings.');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchListings();
    }, []);

    const handleToggle = async (listingId, isEnabled) => {
        try {
            await api.toggleListingStatus(listingId, isEnabled);
            message.success(`Listing ${isEnabled ? 'enabled' : 'disabled'} successfully.`);
            fetchListings();
        } catch (error) {
            console.error('Failed to toggle listing:', error);
            message.error('Failed to update listing status.');
        }
    };

    const handleDelete = async (listingId) => {
        try {
            await api.deleteListing(listingId);
            message.success('Listing deleted successfully.');
            fetchListings();
        } catch (error) {
            console.error('Failed to delete listing:', error);
            message.error('Failed to delete listing.');
        }
    };


    const handleAddListing = async (values) => {
        try {
            const formData = new FormData();
            const imageFile = values.image?.fileList?.[0]?.originFileObj;
            if (!imageFile) {
                throw new Error('please upload correct image');
            }

            const listingData = {
                title: values.title.toString().trim(),
                brand: values.brand.toString().trim(),
                price: Number(values.price),
                stock: Number(values.stock) || 0,
                image: imageFile.name
            };

            formData.append('listingData', JSON.stringify(listingData));
            formData.append('image', imageFile, imageFile.name);

            const response = await axios.post('http://localhost:3000/profiles/listings/addListing', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            message.success('Listing added successfully!');
            setAddModalVisible(false); // Close the modal
            form.resetFields(); // Reset the form
            fetchListings(); // Refresh the listings table
            // return response.data; // Not strictly necessary to return if not used
        } catch (error) {
            console.error('Error:', error);
            message.error(error.response?.data?.message || 'upload failure');
            throw error;
        }
    };


    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
        },
        {
            title: 'Stock',
            dataIndex: 'stock',
            key: 'stock',
        },
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            render: (imageUrl) => (
                <Image
                    width={50}
                    src={`http://localhost:3000/images/${imageUrl}`}
                    alt="Listing image"
                    fallback="https://via.placeholder.com/50"
                />
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price}`,
        },
        {
            title: 'Enabled',
            dataIndex: 'disabled',
            key: 'isEnabled',
            render: (disabledStatus, record) => (
                <Switch
                    checked={!disabledStatus}
                    onChange={(newCheckedState) => handleToggle(record._id, newCheckedState)}
                />
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Are you sure to delete this listing?"
                    onConfirm={() => handleDelete(record._id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button type="link" danger>Delete</Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div style={{ marginTop: 32 }}>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Button type="primary" onClick={() => setAddModalVisible(true)}>
                    Add New Listing
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={listings}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 5 }}
            />

            <Modal
                title="Add New Listing"
                open={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleAddListing}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="stock" label="stock" rules={[{ required: true }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label="Image"
                        valuePropName="file"
                        getValueFromEvent={(e) => e}
                        rules={[{ required: true, message: 'Please upload an image' }]}
                    >
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}


function MyReviews({ user }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMyReviews = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.getUserReviews(); 
            setReviews(response.reviews || []); 

        } catch (err) {
            console.error('Failed to fetch user reviews:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Could not load your reviews.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [user]);
    useEffect(() => {
        fetchMyReviews();
    }, [fetchMyReviews]);

    const handleToggleVisibility = async (reviewToToggle) => {
        const isActuallyHidden = String(reviewToToggle.hidden).toLowerCase() === 'true';
        const newVisibilityState = !isActuallyHidden;

        const phoneIdForApi = reviewToToggle.phoneId;
        const reviewerIdForApi = user.id; 

        try {
            await api.toggleReviewVisibility(phoneIdForApi, reviewerIdForApi, newVisibilityState);
            message.success(`Review visibility updated.`);
            // Correctly identify the specific review to update by checking both phoneId and reviewer
            setReviews(prevReviews =>
                prevReviews.map(r =>
                    (String(r.phoneId) === String(reviewToToggle.phoneId) && String(r.reviewer) === String(reviewToToggle.reviewer))
                    ? { ...r, hidden: newVisibilityState } : r)
            );
        } catch (err) {
            console.error("Failed to toggle review visibility:", err);
            message.error(err.message || "Could not update review visibility. Please try again.");
        }
    };

    if (loading) return <p>Loading your reviews...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div style={{ marginTop: 32 }}>
            {reviews.length === 0 && <p>You haven't written any reviews yet.</p>}
            {Array.isArray(reviews) && reviews.map(review => (
                <div 
                    key={`${review.phoneId}-${review.reviewer}`} 
                    className="my-review-item-wrapper" 
                    style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}
                >
                    <Review
                        review={{
                           ...review,
                           title: `Comment for: ${review.phoneTitle}`
                        }}
                        canToggle={true}
                        onToggleVisibility={handleToggleVisibility}
                    />
                </div>
            ))}
        </div>
    );
}


function ProfilePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return <div>Loading user info...</div>;
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
            <h2>Profile Page</h2>

            <div style={{ marginTop: 24 }}>
                <Tabs
                    defaultActiveKey="1"
                    centered
                    items={[
                        {
                            label: 'Edit Profile',
                            key: '1',
                            children: <EditProfile user={user} />,
                        },
                        {
                            label: 'Change Password',
                            key: '2',
                            children: <ChangePassword />,
                        },
                        {
                            label: 'Manage Listings',
                            key: '3',
                            children: <ManageListings user={user} />,
                        },
                        {
                            label: 'My Reviews',
                            key: '4',
                            children: <MyReviews user={user} />,
                        },
                    ]}
                />

            </div>
        </div>
    );
}
export default ProfilePage;