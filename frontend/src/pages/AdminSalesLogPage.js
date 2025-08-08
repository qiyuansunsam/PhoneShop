import React, { useEffect, useState } from 'react';
import { Table, Button, Select, message } from 'antd';
import { fetchSalesLogs, exportSalesHistory } from '../services/api';

const AdminSalesLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [format, setFormat] = useState('json');

    const loadSalesLogs = async () => {
        try {
            setLoading(true);
            const data = await fetchSalesLogs();
            console.log(data)
            // Assuming data is { message: "...", salesLogs: [...] }
            setLogs(Array.isArray(data.salesLogs) ? data.salesLogs : []);
        } catch (err) {
            console.error('Failed to fetch sales logs:', err);
            message.error('Failed to load sales logs');
        } finally {
            setLoading(false);
        }
    };

    const convertJsonToCsv = (jsonData) => {
        if (!jsonData || jsonData.length === 0) {
            return "";
        }

        const headers = [
            "Order ID",
            "Timestamp",
            "Buyer ID",
            "Product IDs",        // Changed to plural
            "Product Quantities", // Changed to plural
            "Product Unit Prices",// Changed to plural
            "Total Order Price"
        ];

        let csvString = headers.join(",") + "\r\n";

        jsonData.forEach(log => {
            const orderId = log._id ? String(log._id) : 'N/A';
            const timestamp = log.createdAt ? new Date(log.createdAt).toISOString() : 'N/A';
            const buyerId = log.buyer ? String(log.buyer) : 'N/A';
            const totalOrderPrice = typeof log.totalPrice === 'number' ? log.totalPrice.toFixed(2) : '0.00';

            let productIds = [];
            let productQuantities = [];
            let productUnitPrices = [];

            if (log.products && Array.isArray(log.products) && log.products.length > 0) {
                log.products.forEach(product => {
                    productIds.push(product._id ? String(product._id) : 'N/A');
                    productQuantities.push(typeof product.number === 'number' ? product.number : 0);
                    productUnitPrices.push(typeof product.price === 'number' ? product.price.toFixed(2) : '0.00');
                });
            }

            const row = [
                orderId,
                timestamp,
                buyerId,
                productIds.join('; '),       // Semicolon-separated
                productQuantities.join('; '), // Semicolon-separated
                productUnitPrices.join('; '),// Semicolon-separated
                totalOrderPrice
            ];
            csvString += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\r\n";
        });
        return csvString;
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const response = await exportSalesHistory(); // This API now always returns JSON

            let blob;
            const downloadFileName = `sales-history.${format}`;
            const actualSalesData = (response && response.salesLogs) ? response.salesLogs : Array.isArray(response) ? response : [];

            if (format === 'csv') {
                const csvString = convertJsonToCsv(actualSalesData);
                blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            } else { // format === 'json'
                blob = new Blob([JSON.stringify(actualSalesData, null, 2)], { type: 'application/json' });
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadFileName;
            document.body.appendChild(a); // Append to body for Firefox compatibility
            a.click();
            document.body.removeChild(a); // Clean up
            URL.revokeObjectURL(url);
            message.success(`Sales history successfully exported as ${format.toUpperCase()}.`);
        } catch (err) {
            console.error('Export failed:', err);
            message.error(`Export failed: ${err.message || 'Unknown error'}`);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        loadSalesLogs();
    }, []);

    const validLogs = Array.isArray(logs) ? logs : [];
    // Filter by buyer ID as buyerName is not directly in the salesLog structure
    const uniqueBuyerIds = [...new Set(validLogs.map(log => log.buyer).filter(Boolean))].sort();

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'createdAt', // Changed from 'timestamp'
            key: 'createdAt',
            render: (text) => text ? new Date(text).toLocaleString() : 'N/A',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Buyer',
            dataIndex: 'buyer', // Changed from 'buyerName' to 'buyer' (ID)
            key: 'buyer',
            render: (buyerId) => buyerId || 'N/A', // Display the buyer ID
            sorter: (a, b) => (a.buyer || '').localeCompare(b.buyer || ''),
            filters: uniqueBuyerIds.map(id => ({ text: id, value: id })),
            onFilter: (value, record) => record.buyer === value,
        },
        {
            title: 'Items',
            dataIndex: 'products',
            key: 'products',
            render: products => (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {(Array.isArray(products) ? products : []).map((item, index) => (
                        // item.title is not available, using item._id (product ID)
                        // item.quantity is item.number
                        <li key={item._id || index}>
                            Product ID: {item._id} × {item.number} (Price: ${Number(item.price).toFixed(2)})
                        </li>
                    ))}
                </ul>
            )
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalPrice', // Changed from 'totalAmount'
            key: 'totalPrice',
            render: amt => `$${Number(amt).toFixed(2)}`,
            sorter: (a, b) => (a.totalPrice || 0) - (b.totalPrice || 0),
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <h2>Sales Logs</h2>

            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Select value={format} onChange={setFormat} style={{ width: 120, marginRight: 8 }}>
                        <Select.Option value="json">JSON</Select.Option>
                        <Select.Option value="csv">CSV</Select.Option>
                    </Select>
                    <Button onClick={handleExport} loading={exporting}>Export</Button>
                </div>
            </div>

            <Table
                dataSource={validLogs} // Use validated logs array
                columns={columns}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default AdminSalesLogPage;
