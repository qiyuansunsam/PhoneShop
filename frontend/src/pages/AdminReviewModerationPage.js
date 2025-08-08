// pages/AdminReviewModerationPage.js
import React, { useEffect, useState } from 'react';
import { Table, Input, Button, message, Switch, Popconfirm } from 'antd';
import StarRating from '../components/StarRating'; // Assuming you have a StarRating component
import * as api from '../services/api'; // Import all from api

const { Search } = Input;

const AdminReviewModerationPage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Cache for reviewer names
    const reviewerNameCache = new Map();

    // Load all reviews from the backend
    const loadAllReviews = async () => {
        setLoading(true);
        try {
            // Always fetch all reviews; backend search query is removed from here
            const data = await api.fetchAllReviews(); 
            let fetchedReviews = Array.isArray(data.reviews) ? data.reviews : [];

            // Enrich reviews with userName if not present
            if (fetchedReviews.length > 0) {
                fetchedReviews = await Promise.all(
                    fetchedReviews.map(async (review) => {
                        if (review.userName) { // If userName already exists, use it
                            return review;
                        }
                        if (review.reviewer && !reviewerNameCache.has(String(review.reviewer))) {
                            try {
                                const userData = await api.getUserNameById(String(review.reviewer));
                                // Assuming api.getUserNameById returns { username: "First Last" }
                                const fullName = userData.username || String(review.reviewer);
                                reviewerNameCache.set(String(review.reviewer), fullName);
                                return { ...review, userName: fullName };
                            } catch (e) {
                                console.warn(`Could not fetch username for reviewer ${review.reviewer}:`, e);
                                reviewerNameCache.set(String(review.reviewer), String(review.reviewer)); // Cache failure
                                return { ...review, userName: String(review.reviewer) }; // Fallback to ID
                            }
                        } else if (review.reviewer) {
                            return { ...review, userName: reviewerNameCache.get(String(review.reviewer)) || String(review.reviewer) };
                        }
                        return review; // Return original review if no reviewer ID or already processed
                    })
                );
            }
            setReviews(fetchedReviews);
        } catch (err) {
            console.error(err);
            message.error('Failed to fetch reviews.');
            setReviews([]); // Clear reviews on error
            // setFilteredReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllReviews();
    }, []);

    // Effect for frontend filtering
    useEffect(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (!lowerSearchTerm) {
            setFilteredReviews(reviews);
        } else {
            const filtered = reviews.filter(review =>
                (review.userName && review.userName.toLowerCase().includes(lowerSearchTerm)) ||
                (review.reviewer && review.reviewer.toLowerCase().includes(lowerSearchTerm)) ||
                (review.listingTitle && review.listingTitle.toLowerCase().includes(lowerSearchTerm)) ||
                (review.comment && review.comment.toLowerCase().includes(lowerSearchTerm))
            );
            setFilteredReviews(filtered);
        }
    }, [searchTerm, reviews]);

    const onSearch = (value) => {
        setSearchTerm(value);
    };

    const handleToggleVisibility = async (reviewRecord, newIsHiddenState) => {
        console.log(reviewRecord)
        if (!reviewRecord || typeof reviewRecord.phoneId === 'undefined' || typeof reviewRecord.reviewer === 'undefined') {
            message.error('Review data is incomplete for toggling visibility.');
            return;
        }
        try {
            await api.toggleReviewVisibilityAdmin(reviewRecord.phoneId, reviewRecord.reviewer, newIsHiddenState);
            message.success(`Review visibility updated successfully.`);
            loadAllReviews(); // Reload all reviews, useEffect will re-apply search
        } catch (err) {
            console.error(err);
            message.error('Failed to update review visibility.');
        }
    };

    // Filters for 'Visibility' and 'Rating' can still use unique values from the original 'reviews' list
    // or from 'filteredReviews' if you want them to adapt to the search. For now, let's keep them broad.
    const columns = [
        {
            title: 'Reviewer',
            dataIndex: 'userName', // Primary data field for this column
            key: 'reviewerInfo', // A more descriptive key
            render: (userName, record) => userName || record.reviewer || 'N/A', // Display name, fallback to ID
            sorter: (a, b) => {
                const valA = a.userName || a.reviewer || '';
                const valB = b.userName || b.reviewer || '';
                return valA.localeCompare(valB);
            },
            // Removed frontend column filter for reviewer name
        },
        {
            title: 'Reviewer ID',
            dataIndex: 'reviewer',
            key: 'reviewerId',
            ellipsis: true,
            sorter: (a, b) => (a.reviewer || '').localeCompare(b.reviewer || ''),
            // No column-specific filter for ID, covered by global search
        },
        {
            title: 'Listing',
            dataIndex: 'listingTitle',
            key: 'listingTitle',
            sorter: (a, b) => (a.listingTitle || '').localeCompare(b.listingTitle || ''),
            // Removed frontend column filter for listing title
        },
        {
            title: 'Content',
            dataIndex: 'comment', // Changed from 'content' to 'comment'
            key: 'comment',
            ellipsis: true, // Add ellipsis for long comments
            sorter: (a, b) => (a.comment || '').localeCompare(b.comment || ''),
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 180, // Increased width for better star display
            render: (rating) => rating !== undefined ? <StarRating rating={rating} /> : 'N/A',
            sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
        },
        {
            title: 'Visibility',
            dataIndex: 'hidden',
            key: 'hidden',
            // The first render was overwritten by the second one. Removing the first.
            render: (text, record) => (
                <Popconfirm
                    title={`Are you sure to make this review ${record.hidden === 'true' ? 'visible' : 'hidden'}?`}
                    onConfirm={() => handleToggleVisibility(record, !(record.hidden === 'true'))}
                    okText="Yes"
                    cancelText="No"
                >
                    <Switch
                        checked={record.hidden !== 'true'}
                        checkedChildren="Visible"
                        unCheckedChildren="Hidden"
                    />
                </Popconfirm>
            ),
            filters: [
                { text: 'Visible', value: 'false' }, // Not hidden
                { text: 'Hidden', value: 'true' },   // Is hidden
            ],
            onFilter: (value, record) => {
                const isEffectivelyHidden = record.hidden === 'true'; 
                return isEffectivelyHidden === (value === 'true');
            },
        },
    ];

    return (
        <div>
            <Search
                placeholder="Search by Reviewer (Name/ID), Listing, or Content"
                enterButton
                allowClear
                onSearch={onSearch}
                style={{ maxWidth: 400, marginBottom: 16 }}
            />
            <Table
                columns={columns}
                dataSource={filteredReviews} // Use the filtered list for display
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 6 }}
            />
        </div>
    );
};

export default AdminReviewModerationPage;
