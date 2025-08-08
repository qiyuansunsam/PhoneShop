// pages/AdminUserManagementPage.js
import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Modal, Form, message, Popconfirm, Typography, List, Switch } from 'antd';
import { // disableUser API call will be replaced by updateUserDetails for toggling active status
    fetchAllUsers, updateUserDetails, disableUser, deleteUser, getUserListingsAndReviews
} from '../services/api';

const AdminUserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewedUserId, setViewedUserId] = useState(null); // To store the ID of the user being viewed
    const [pageSize, setPageSize] = useState(5); // Default page size

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchAllUsers(search);
            setUsers(Array.isArray(data.users) ? data.users : []); // Access data.users
        } catch (err) {
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [search]);

    const handleEdit = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email
        });
    };

    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            await updateUserDetails(editingUser._id, values);
            message.success('User updated successfully');
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            message.error(err.message || 'Update failed');
        }
    };

    const handleToggleUserActive = async (userId, currentIsActive) => {
        const newActiveState = !currentIsActive;
        try {
            // Use updateUserDetails to change the active status
            await updateUserDetails(userId, { active: newActiveState });
            message.success(`User ${newActiveState ? 'enabled' : 'disabled'} successfully`);
            loadUsers();
        } catch (err) {
            message.error(err.message || `Failed to update user status`);
        }
    }

    const handleDelete = async (userId) => {
        try {
            await deleteUser(userId);
            message.success('User deleted successfully');
            loadUsers();
        } catch (err) {
            message.error(err.message || 'Failed to delete user');
        }
    };

    const handleViewDetails = async (userId) => {
        try {
            setLoading(true); // Indicate loading for details
            setViewedUserId(userId); // Store the ID of the user whose details are being viewed
            const details = await getUserListingsAndReviews(userId);
            console.log(details)
            setUserDetails(details);
            setDetailsModalVisible(true);
        } catch (err) {
            message.error(err.message || 'Failed to fetch user details');
        } finally {
            setLoading(false); // Reset loading state for details modal
        }
    };

    const columns = [
        {
            title: 'User ID',
            dataIndex: '_id',
            key: '_id',
            width: 250, // Example width
            ellipsis: true,
            sorter: (a, b) => (a._id || '').localeCompare(b._id || ''),
            // Optional: Add a filter if exact ID matching is needed, though search usually covers this.
        },
        {
            title: 'Full Name',
            // dataIndex: 'fullname', // Replaced with render
            key: 'fullname',
            width: 200, // Example width, adjust as needed
                ellipsis: true,
            render: (text, record) => `${record.firstname || ''} ${record.lastname || ''}`.trim() || record.username || 'N/A',
            sorter: (a, b) => (`${a.firstname || ''} ${a.lastname || ''}`.trim() || a.username || '').localeCompare((`${b.firstname || ''} ${b.lastname || ''}`.trim() || b.username || '')),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 250, // Example width, adjust as needed
                ellipsis: true,
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Last Login',
            dataIndex: 'lastLogin',
            key: 'lastLogin',
            width: 180, // Example width, adjust as needed
            render: (text) => text ? new Date(text).toLocaleString() : 'N/A',
            sorter: (a, b) => {
                const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
                const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
                return dateA - dateB;
            },
        },
        {
            title: 'Status',
            dataIndex: 'active',
            key: 'active',
            width: 120, // Example width for consistency
            render: (isActive, record) => (
                <Popconfirm
                    title={`Are you sure you want to ${record.active ? 'disable' : 'enable'} this user?`}
                    onConfirm={() => handleToggleUserActive(record._id, record.active)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Switch
                        checked={isActive}
                        checkedChildren="Active"
                        unCheckedChildren="Disabled"
                    />
                </Popconfirm>
            ),
            filters: [
                { text: 'Active', value: true },
                { text: 'Disabled', value: false },
            ],
            onFilter: (value, record) => record.active === value,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200, // Example width, adjust as needed
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
                    <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(record._id)}>
                        <Button size="small" danger>Delete</Button>
                    </Popconfirm>
                    <Button size="small" onClick={() => handleViewDetails(record._id)}>View Details</Button>
                </Space>
            )
        }
    ];

    return (
        <div>
            <Input.Search
                placeholder="Search by name, email, or User ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={loadUsers}
                enterButton
                style={{ width: 300, marginBottom: 16 }}
            />
            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: users.length, // Required for client-side pagination
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50', '100'],
                    onChange: (page, newPageSize) => {
                        setCurrentPage(page);
                        setPageSize(newPageSize);
                    },
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
                }}
            />

            <Modal
                open={!!editingUser}
                title="Edit User"
                onCancel={() => setEditingUser(null)}
                onOk={handleUpdate}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="firstname" label="First Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lastname" label="Last Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                open={detailsModalVisible}
                title="User Listings and Reviews"
                onCancel={() => setDetailsModalVisible(false)}
                footer={null}
                width={800}
            >
                {userDetails ? (
                    <div>
                        <Typography.Title level={4}>Listings</Typography.Title>
                        {userDetails.listings && userDetails.listings.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={userDetails.listings}
                                renderItem={listing => (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={listing.title}
                                            description={`Price: $${listing.price} - Stock: ${listing.stock}`}
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : <Typography.Text>No listings found for this user.</Typography.Text>}

                        <Typography.Title level={4} style={{ marginTop: 20 }}>Reviews</Typography.Title>
                        {userDetails.reviewed && userDetails.reviewed.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={userDetails.reviewed} 
                                renderItem={phoneObject => { 
                                    const reviewByThisUser = Array.isArray(phoneObject.reviews)
                                        ? phoneObject.reviews.find(r => String(r.reviewer) === String(viewedUserId))
                                        : null;

                                    if (!reviewByThisUser) {
                                        return null;
                                    }

                                    return (
                                        <List.Item key={phoneObject._id}>
                                            <List.Item.Meta
                                                title={
                                                    <Typography.Text ellipsis={true}>
                                                        Review for: {phoneObject.title || 'Unknown Phone'}
                                                    </Typography.Text>
                                                }
                                                description={`Rating: ${reviewByThisUser.rating !== undefined ? reviewByThisUser.rating : 'N/A'} - Comment: ${reviewByThisUser.comment || 'No comment'}`}
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        ) : <Typography.Text>No reviews found by this user.</Typography.Text>}
                    </div>
                ) : 'Loading...'}
            </Modal>
        </div>
    );
};

export default AdminUserManagementPage;
