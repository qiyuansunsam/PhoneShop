import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Popconfirm, Modal, Form, message, Space, Slider, InputNumber, Typography, List, Image, Switch } from 'antd'; // Import Switch
import { FilterOutlined, EditOutlined } from '@ant-design/icons'; // Import EditOutlined
import * as api from '../services/api';
const { Title, Text } = Typography;

const AdminListingManagementPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [editingListing, setEditingListing] = useState(null);
    const [form] = Form.useForm();    
    const [detailsListing, setDetailsListing] = useState(null); // State for Details Modal
    const [priceRange, setPriceRange] = useState([0, 100]); // Default initial range
    const [stockRange, setStockRange] = useState([0, 50]);  // Default initial range

    const fetchListings = async () => {
        setLoading(true);
        try {
            const data = await api.fetchAllListings(search);
            console.log(data)
            const fetchedListings = Array.isArray(data.listings) ? data.listings : [];
            setListings(fetchedListings);

            if (fetchedListings.length > 0) {
                const prices = fetchedListings.map(item => Number(item.price)).filter(p => typeof p === 'number' && !isNaN(p) && isFinite(p));
                const stocks = fetchedListings.map(item => Number(item.stock)).filter(s => typeof s === 'number' && !isNaN(s) && isFinite(s));

                setPriceRange(prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 100]);
                setStockRange(stocks.length > 0 ? [Math.min(...stocks), Math.max(...stocks)] : [0, 50]);
            } else {
                // Reset to default if no data
                setPriceRange([0, 100]);
                setStockRange([0, 50]);
            }
        } catch (err) {
            message.error('Failed to load listings');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchListings();
    }, [search]);

    const handleEdit = (record) => {
        setEditingListing(record);
        form.setFieldsValue(record);
    };
    const handleViewDetails = (record) => {
        setDetailsListing(record);
    };
    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            const updates = {
                title: values.title,
                brand: values.brand,
                price: Number(values.price),
                stock: Number(values.stock),
                seller: values.seller,
            };
            await api.updateListingDetails(editingListing._id, updates);
            message.success('Listing updated');
            setEditingListing(null);
            fetchListings();
        } catch (err) {
            message.error('Failed to update listing');
        }
    };

    const handleToggleListingEnabled = async (listingId, currentIsDisabled) => {
        const newDisabledState = !currentIsDisabled;
        try {
            await api.updateListingDetails(listingId, { disabled: newDisabledState });
            message.success(`Listing ${newDisabledState ? 'disabled' : 'enabled'} successfully`);
            fetchListings();
        } catch (err) {
            message.error(err.message || 'Failed to update listing status');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteListingAdmin(id);
            message.success('Listing deleted');
            fetchListings();
        } catch {
            message.error('Failed to delete');
        }
    };

    const uniqueBrands = listings ? [...new Set(listings.map(item => item.brand).filter(Boolean))].sort() : [];
    const uniqueSellerEmails = listings ? [...new Set(listings.map(item => item.seller).filter(Boolean))].sort() : [];

    const getColumnSearchProps = (dataIndex, overallMinMaxRange) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
            const [overallMin, overallMax] = overallMinMaxRange;

            let tempRange = selectedKeys[0] || [overallMin, overallMax];

            if (!Array.isArray(tempRange) || tempRange.length !== 2 ||
                typeof tempRange[0] !== 'number' || !isFinite(tempRange[0]) ||
                typeof tempRange[1] !== 'number' || !isFinite(tempRange[1])) {
                tempRange = [overallMin, overallMax];
            }

            let currentSelectedMin = Math.max(overallMin, Math.min(tempRange[0], tempRange[1]));
            let currentSelectedMax = Math.min(overallMax, Math.max(tempRange[0], tempRange[1]));
            if (currentSelectedMin > currentSelectedMax) {
                currentSelectedMin = overallMin;
                currentSelectedMax = overallMax;
            }
            tempRange = [currentSelectedMin, currentSelectedMax];

            return (
                <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                    <Slider
                        range
                        min={overallMin}
                        max={overallMax}
                        value={tempRange}
                        onChange={(value) => setSelectedKeys(value && value.length === 2 ? [value] : [])}
                        style={{ marginBottom: 8 }}
                        disabled={overallMin >= overallMax}
                    />
                    <Space>
                        <InputNumber style={{width: '80px'}} min={overallMin} max={overallMax} value={tempRange[0]} onChange={val => setSelectedKeys([[(typeof val === 'number' ? val : tempRange[0]), tempRange[1]]])} />
                        <InputNumber style={{width: '80px'}} min={overallMin} max={overallMax} value={tempRange[1]} onChange={val => setSelectedKeys([[tempRange[0], (typeof val === 'number' ? val : tempRange[1])]])} />
                    </Space>
                    <Space style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
                            OK
                        </Button>
                        <Button onClick={() => { if(clearFilters) clearFilters(); setSelectedKeys([]); confirm(); }} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            );
        },
        onFilter: (value, record) => 
            typeof record[dataIndex] === 'number' && record[dataIndex] >= value[0] && record[dataIndex] <= value[1],
        filterIcon: filtered => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    });

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 250, // Example width
            ellipsis: true,
            sorter: (a, b) => a.title.localeCompare(b.title),
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
            width: 150, // Example width
            ellipsis: true,
            sorter: (a, b) => (a.brand || '').localeCompare(b.brand || ''),
            filters: uniqueBrands.map(brand => ({ text: brand, value: brand })),
            onFilter: (value, record) => record.brand === value,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 120, // Example width
            sorter: (a, b) => a.price - b.price,
            render: val => `$${Number(val).toFixed(2)}`,
            ...getColumnSearchProps('price', priceRange),
        },
        {
            title: 'Stock',
            dataIndex: 'stock',
            key: 'stock',
            width: 100, // Example width
            sorter: (a, b) => a.stock - b.stock,
            ...getColumnSearchProps('stock', stockRange),
        },
        {
            title: 'Enabled',
            dataIndex: 'disabled',
            key: 'enabled',
            width: 120, // Example width
            render: (isDisabled, record) => (
                <Popconfirm
                    title={`Are you sure to ${!record.disabled ? 'disable' : 'enable'} this listing?`}
                    onConfirm={() => handleToggleListingEnabled(record._id, record.disabled)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Switch
                        checked={!isDisabled}
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                    />
                </Popconfirm>
            ),
            filters: [
                { text: 'Enabled', value: false },
                { text: 'Disabled', value: true },
            ],
            onFilter: (value, record) => {
                if (value === true) {
                    return record.disabled === true;
                } else {
                    return record.disabled === false || record.disabled == null;
                }
            },
        },
        {
            title: 'Seller',
            dataIndex: 'seller',
            key: 'seller',
            width: 200, // Example width
            ellipsis: true,
            sorter: (a, b) => (a.seller || '').localeCompare(b.seller || ''),
            filters: uniqueSellerEmails.map(email => ({ text: email, value: email })),
            onFilter: (value, record) => record.seller === value,
        },
        {
            title: 'Action',
            key: 'action',
            width: 220, // Adjusted width for 3 buttons
            render: (_, record) => (
                <Space size="small"> {/* Removed 'wrap' to keep buttons on a single line */}
                    <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
                    <Button size="small" onClick={() => handleViewDetails(record)}>Details</Button>
                    <Popconfirm title="Delete this listing?" onConfirm={() => handleDelete(record._id)}>
                        <Button danger size="small">Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <Input.Search
                placeholder="Search by title or brand"
                enterButton
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={() => fetchListings()}
                style={{ width: 300, marginBottom: 16 }}
            />
            <Table columns={columns} dataSource={listings} rowKey="_id" loading={loading} />
            
            {/* Edit Listing Modal */}
            <Modal
                open={!!editingListing}
                title={`Edit ${editingListing?.title || 'Listing'}`}
                onCancel={() => setEditingListing(null)}
                onOk={handleUpdate}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="stock" label="Stock" rules={[{ required: true }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="seller" label="Seller (Username/ID)" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Details Listing Modal */}
            <Modal
                open={!!detailsListing} // Open when detailsListing is not null
                title={`Details for ${detailsListing?.title || 'Listing'}`}
                onCancel={() => setDetailsListing(null)} // Close by setting detailsListing to null
                footer={null} // No footer buttons needed
                width={600} // Adjust width as needed
            >
                {detailsListing && (
                    <div>
                        <Title level={4}>Main Details</Title>
                        <p><Text strong>ID:</Text> {detailsListing._id}</p>
                        <p><Text strong>Brand:</Text> {detailsListing.brand}</p>
                        <p><Text strong>Price:</Text> ${Number(detailsListing.price).toFixed(2)}</p>
                        <p><Text strong>Stock:</Text> {detailsListing.stock}</p>
                        <p><Text strong>Seller:</Text> {detailsListing.seller}</p>
                        <p><Text strong>Image:</Text> {detailsListing.image}</p> {/* Or render the image */}
                         {detailsListing.image && (
                             <Image
                                width={100}
                                src={`http://localhost:3000/images/${detailsListing.image}`}
                                alt="Listing image"
                                fallback="http://localhost:3000/images/Apple.jepg"
                                preview={false}
                                style={{ marginTop: 8 }}
                            />
                         )}


                        <Title level={4} style={{ marginTop: 20 }}>Reviews ({detailsListing.reviews?.length || 0})</Title>
                        {detailsListing.reviews && detailsListing.reviews.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={detailsListing.reviews}
                                renderItem={(review, index) => (
                                    <List.Item key={review._id || index}> {/* Use review._id if available, fallback to index */}
                                        <List.Item.Meta
                                            title={`Reviewer: ${review.reviewer || 'N/A'}`} // Assuming reviewer is an ID or identifier
                                            description={
                                                <>
                                                    <p>Rating: {review.rating !== undefined ? `${review.rating}/5` : 'N/A'}</p>
                                                    <p>Comment: {review.comment || 'No comment'}</p>
                                                    {review.hidden !== undefined && <p>Hidden: {review.hidden ? 'Yes' : 'No'}</p>}
                                                </>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Text>No reviews available for this listing.</Text>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminListingManagementPage;
