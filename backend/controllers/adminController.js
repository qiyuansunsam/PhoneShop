const Admistrator = require('../models/administrator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require("mongoose");
const Phone = require('../models/phone');
const fs = require('fs');

// Logging function
const logAction = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFile('admin_action.log', logMessage, (err) => {
        if (err) {
            console.error('Error logging action:', err);
        }
    });
};

//check login isLoggedIn
const isLoggedIn = (req, res, next) => {
    if (req.session.user && req.session.user.email && req.session.user.username) {
        return true;
    } else {
        logAction(`Failed login check: Admin not logged in.`);
        res.status(401).json({
            message: 'admin not logged in',
        });
        return false;
    }
};

// admin login
const login = async (req, res) => {
    let { email, password } = req.body;
    if (email && password) {
        try {
            const administrator = await Admistrator.find({ email: { $eq: email } });
            if (administrator.length === 1) {
                const check = await bcrypt.compare(password, administrator[0].password);
                if (check) {
                    req.session.user = {
                        id: administrator[0]._id,
                        email: administrator[0].email,
                        username: administrator[0].username,
                    };
                    await new Promise((resolve, reject) => {
                        req.session.save(err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    logAction(`Admin ${administrator[0].username} logged in successfully.`);
                    return res.status(200).json({
                        message: 'User login successful',
                        user: req.session.user,
                    });
                } else {
                    logAction(`Failed login attempt for admin with email ${email}: Invalid password.`);
                    return res.status(401).json({
                        message: "Invalid password"
                    });
                }
            } else if (administrator.length === 0) {
                logAction(`Failed login attempt for admin with email ${email}: User not found.`);
                return res.status(404).json({
                    message: "user not found"
                });
            } else {
                logAction(`Database error while logging in admin with email ${email}.`);
                res.status(500).json({
                    message: "database error"
                });
            }
        } catch (e) {
            logAction(`Database error while logging in admin with email ${email}: ${e.message}`);
            return res.status(500).json({
                message: "database error"
            });
        }
    } else {
        logAction('Login attempt failed: email or password is missing.');
        return res.status(403).json({
            message: "email or password is missing"
        });
    }
};

// admin logout
const logout = async (req, res) => {
    try {
        // Destroy the session
        await new Promise((resolve, reject) => {
            req.session.destroy(err => {
                if (err) reject(err);
                else resolve();
            });
        });
        logAction(`Admin  logged out successfully.`);
        return res.status(200).json({
            message: 'User logged out successfully',
        });
    } catch (e) {
        logAction(`Error logging out admin: ${e.message}`);
        return res.status(500).json({
            message: "Error logging out",
        });
    }
};

// check admin session
const checkAdminSession = async (req, res) => {
    try {
        if (req.session.user && req.session.user.email && req.session.user.username) {
            logAction(`Checked admin session for ${req.session.user.username}: Active.`);
            return res.status(200).json({
                message: 'Admin session is active',
                user: req.session.user,
            });
        } else {
            logAction('Checked admin session: Admin not logged in.');
            return res.status(401).json({
                message: 'Admin not logged in',
            });
        }
    } catch (e) {
        logAction('Error checking admin session: ' + e.message);
        return res.status(500).json({
            message: 'Error checking admin session',
        });
    }
};

// Fetch All Users
const fetchUsers = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.email) {
            logAction(`Attempt to fetch users by admin not logged in.`);
            return res.status(401).json({
                message: 'Admin not logged in or not authorized.',
            });
        }

        const query = req.query.search || '';
        const queryParts = query.split(' ').filter(part => part.length > 0);
        let searchConditions = [];

        if (query) {
            searchConditions = [
                { email: new RegExp(query, 'i') },
                { username: new RegExp(query, 'i') },
                { firstname: new RegExp(query, 'i') }
            ];

            if (queryParts.length > 1) {
                searchConditions.push({
                    $and: [
                        { firstname: new RegExp(queryParts[0], 'i') },
                        { lastname: new RegExp(queryParts.slice(1).join(' '), 'i') }
                    ]
                });
            } else {
                searchConditions.push({ lastname: new RegExp(query, 'i') });
            }

            if (query.match(/^[0-9a-fA-F]{24}$/)) {
                searchConditions.push({ _id: query });
            }
        }

        let users;
        if (searchConditions.length > 0) {
            users = await User.find({ $or: searchConditions });
        } else {
            users = await User.find({});
        }

        logAction(`Admin ${req.session.user.username} fetched users successfully.`);
        return res.status(200).json({
            message: 'Users fetched successfully',
            users: users
        });

    } catch (e) {
        console.error('Error fetching users:', e);
        logAction(`Database error while fetching users by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'Database error, failed to fetch users.',
        });
    }
};

// Update User Details
const updateUserDetails = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const userId = req.params.userId;
        const updates = req.body;

        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) {
            logAction(`Admin ${req.session.user.username} attempted to update user with ID ${userId}: User not found.`);
            return res.status(404).json({
                message: 'User not found',
            });
        }

        logAction(`Admin ${req.session.user.username} updated user with ID ${userId} successfully.`);
        return res.status(200).json({
            message: 'User details updated successfully',
            user: user,
        });
    } catch (e) {
        logAction(`Database error while updating user details by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to update user details',
        });
    }
};

// Disable User
const disableUser = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const userId = req.params.userId;

        const user = await User.findByIdAndUpdate(userId, { active: false }, { new: true });
        if (!user) {
            logAction(`Admin ${req.session.user.username} attempted to disable user with ID ${userId}: User not found.`);
            return res.status(404).json({
                message: 'User not found',
            });
        }

        logAction(`Admin ${req.session.user.username} disabled user with ID ${userId} successfully.`);
        return res.status(200).json({
            message: 'User disabled successfully',
            user: user,
        });
    } catch (e) {
        logAction(`Database error while disabling user by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to disable user',
        });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const userId = req.params.userId;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            logAction(`Admin ${req.session.user.username} attempted to delete user with ID ${userId}: User not found.`);
            return res.status(404).json({
                message: 'User not found',
            });
        }

        logAction(`Admin ${req.session.user.username} deleted user with ID ${userId} successfully.`);
        return res.status(200).json({
            message: 'User deleted successfully',
            user: user,
        });
    } catch (e) {
        logAction(`Database error while deleting user by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to delete user',
        });
    }
};

// Get User Listings and Reviews
const getUserListingsAndReviews = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            logAction(`Admin ${req.session.user.username} attempted to get listings and reviews for user with ID ${userId}: User not found.`);
            return res.status(404).json({
                message: 'User not found',
            });
        }

        const listings = await Phone.find({ seller: user.id });
        const reviewed = await Phone.find({ 'reviews.reviewer': user.id });
        console.log()
        logAction(`Admin ${req.session.user.username} fetched listings and reviews for user with ID ${userId} successfully.`);
        return res.status(200).json({
            message: 'User listings and reviews fetched successfully',
            listings: listings,
            reviewed: reviewed
        });
    } catch (e) {
        logAction(`Database error while fetching user listings and reviews by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to fetch user listings and reviews',
        });
    }
};

// Fetch Sales Logs
const fetchSalesLogs = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        let query = req.query.search || '';

        const Order = require('../models/order');
        const salesLogs = await Order.find({
            $or: [
                { buyer: new RegExp(query, 'i') }
            ]
        });

        logAction(`Admin ${req.session.user.username} fetched sales logs successfully.`);
        return res.status(200).json({
            message: 'Sales logs fetched successfully',
            salesLogs: salesLogs,
        });
    } catch (e) {
        logAction(`Database error while fetching sales logs by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to fetch sales logs',
        });
    }
};

// Fetch All Listings
const fetchAllListings = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }
        let query = req.query.search || '';
        const listings = await Phone.find({
            $or: [
                { title: new RegExp(query, 'i') },
                { brand: new RegExp(query, 'i') }
            ]
        });
        console.log(query);

        logAction(`Admin ${req.session.user.username} fetched all listings successfully.`);
        return res.status(200).json({
            message: 'Listings fetched successfully',
            listings: listings,
        });
    } catch (e) {
        logAction(`Database error while fetching all listings by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to fetch listings',
        });
    }
};

// Update Listing Details
const updateListingDetails = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const listingId = req.params.listingId;
        const updates = req.body;

        const phone = await Phone.findByIdAndUpdate(listingId, updates, { new: true });
        if (!phone) {
            logAction(`Admin ${req.session.user.username} attempted to update listing with ID ${listingId}: Listing not found.`);
            return res.status(404).json({
                message: 'Listing not found',
            });
        }

        logAction(`Admin ${req.session.user.username} updated listing with ID ${listingId} successfully.`);
        return res.status(200).json({
            message: 'Listing details updated successfully',
            phone: phone,
        });
    } catch (e) {
        logAction(`Database error while updating listing details by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to update listing details',
        });
    }
};

// Disable Listing
const disableListing = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const listingId = req.params.listingId;

        const phone = await Phone.findByIdAndUpdate(listingId, { disabled: true }, { new: true });
        if (!phone) {
            logAction(`Admin ${req.session.user.username} attempted to disable listing with ID ${listingId}: Listing not found.`);
            return res.status(404).json({
                message: 'Listing not found',
            });
        }

        logAction(`Admin ${req.session.user.username} disabled listing with ID ${listingId} successfully.`);
        return res.status(200).json({
            message: 'Listing disabled successfully',
            phone: phone,
        });
    } catch (e) {
        logAction(`Database error while disabling listing by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to disable listing',
        });
    }
};

// Delete Listing Admin
const deleteListingAdmin = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const listingId = req.params.listingId;

        const phone = await Phone.findByIdAndDelete(listingId);
        if (!phone) {
            logAction(`Admin ${req.session.user.username} attempted to delete listing with ID ${listingId}: Listing not found.`);
            return res.status(404).json({
                message: 'Listing not found',
            });
        }

        logAction(`Admin ${req.session.user.username} deleted listing with ID ${listingId} successfully.`);
        return res.status(200).json({
            message: 'Listing deleted successfully',
            phone: phone,
        });
    } catch (e) {
        logAction(`Database error while deleting listing by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to delete listing',
        });
    }
};

// Get Listing Reviews and Seller
const getListingReviewsAndSeller = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const listingId = req.params.listingId;

        const phone = await Phone.findById(listingId).populate('reviews._id');
        if (!phone) {
            logAction(`Admin ${req.session.user.username} attempted to get reviews and seller for listing with ID ${listingId}: Listing not found.`);
            return res.status(404).json({
                message: 'Listing not found',
            });
        }

        // 查找卖家信息
        const seller = await User.findOne({ username: phone.seller });
        if (!seller) {
            logAction(`Admin ${req.session.user.username} attempted to get seller for listing with ID ${listingId}: Seller not found.`);
            return res.status(404).json({
                message: 'Seller not found',
            });
        }

        logAction(`Admin ${req.session.user.username} fetched reviews and seller for listing with ID ${listingId} successfully.`);
        return res.status(200).json({
            message: 'Listing reviews and seller fetched successfully',
            listing: phone,
            seller: seller,
        });
    } catch (e) {
        logAction(`Database error while fetching listing reviews and seller by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to fetch listing reviews and seller',
        });
    }
};

// Export Sales History
const exportSalesHistory = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const format = req.query.format || 'json';

        const Order = require('../models/order');
        const salesLogs = await Order.find();

        if (format === 'json') {
            logAction(`Admin ${req.session.user.username} exported sales history successfully.`);
            return res.status(200).json({
                message: 'Sales history exported successfully',
                salesLogs: salesLogs,
            });
        } else {
            logAction(`Admin ${req.session.user.username} attempted to export sales history: Unsupported format.`);
            return res.status(400).json({
                message: 'Unsupported format',
            });
        }
    } catch (e) {
        logAction(`Database error while exporting sales history by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to export sales history',
        });
    }
};

// Fetch All Reviews
const fetchAllReviews = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        let query = req.query.search || '';

        const phonesWithMatchingReviews = await Phone.find({
            'reviews.comment': new RegExp(query, 'i')
        }).select('title reviews');

        const allReviewsWithTitles = phonesWithMatchingReviews.flatMap(phone => {
            return phone.reviews.map(review => {
                return {
                    ...review.toObject(),
                    listingTitle: phone.title,
                    phoneId: phone._id
                };
            });
        });

        logAction(`Admin ${req.session.user.username} fetched all reviews successfully.`);
        return res.status(200).json({
            message: 'Reviews fetched successfully',
            reviews: allReviewsWithTitles,
        });

    } catch (e) {
        console.error('Error fetching reviews:', e);
        logAction(`Database error while fetching reviews by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to fetch reviews',
            error: e.message
        });
    }
};

// Toggle Review Visibility Admin
const toggleReviewVisibilityAdmin = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const listingId = req.params.listingId;
        const { reviewer, isHidden } = req.body;

        const phone = await Phone.findById(listingId);
        if (!phone) {
            logAction(`Admin ${req.session.user.username} attempted to toggle review visibility for listing with ID ${listingId}: Listing not found.`);
            return res.status(404).json({
                message: 'Listing not found',
            });
        }

        const review = phone.reviews.find(r => r.reviewer === reviewer);
        if (!review) {
            logAction(`Admin ${req.session.user.username} attempted to toggle review visibility for listing with ID ${listingId}: Review not found.`);
            return res.status(404).json({
                message: 'Review not found',
            });
        }

        review.hidden = isHidden;
        await phone.save();

        logAction(`Admin ${req.session.user.username} toggled review visibility for listing with ID ${listingId} successfully.`);
        return res.status(200).json({
            message: 'Review visibility toggled successfully',
            review: review,
        });
    } catch (e) {
        logAction(`Database error while toggling review visibility by admin ${req.session.user.username}: ${e.message}`);
        return res.status(500).json({
            message: 'database error, failed to toggle review visibility',
        });
    }
};

module.exports = {
    login,
    logout,
    checkAdminSession,
    fetchUsers,
    updateUserDetails,
    disableUser,
    deleteUser,
    getUserListingsAndReviews,
    fetchSalesLogs,
    exportSalesHistory,
    fetchAllListings,
    updateListingDetails,
    disableListing,
    deleteListingAdmin,
    getListingReviewsAndSeller,
    fetchAllReviews,
    toggleReviewVisibilityAdmin,
};
