const Admistrator = require('../models/administrator');
const User = require('../models/user');
const Phone = require('../models/phone'); // 确保路径正确
const Wishlist = require('../models/wishlist'); // 确保路径正确
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require("mongoose");

// check login isLoggedIn
const isLoggedIn = (req, res) => {
    if (req.session.user && req.session.user.email && req.session.user.firstname) {
        return true;
    } else {
        res.status(401).json({
            message: ' not logged in',
        });
        return false;
    }
}

// Get Wishlist Items
const getWishlistItems = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const userId = req.session.user.id;

        const wishlist = await Wishlist.findOne({ userId: userId }).populate('items');

        if (!wishlist) {
            return res.status(404).json({
                message: 'Wishlist not found',
            });
        }

        return res.status(200).json({
            message: 'Wishlist fetched successfully',
            wishlist: wishlist.items,
        });
    } catch (e) {
        return res.status(500).json({
            message: 'database error, failed to fetch wishlist',
        });
    }
}

// Update Wishlist Item
const updateWishlistItem = async (req, res) => {
    try {
        if (!isLoggedIn(req, res)) {
            return;
        }

        const userId = req.session.user.id;
        const { itemId, action } = req.body;

        let wishlist = await Wishlist.findOne({ userId: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId: userId, items: [] });
        }

        if (action === 'add') {
            if (!wishlist.items.includes(itemId)) {
                wishlist.items.push(itemId);
            } else {
                return res.status(400).json({
                    message: 'Phone already in wishlist',
                });
            }
        } else if (action === 'remove') {
            const index = wishlist.items.indexOf(itemId);
            if (index === -1) {
                return res.status(400).json({
                    message: 'Phone not found in wishlist',
                });
            }
            wishlist.items.splice(index, 1);
        } else {
            return res.status(400).json({
                message: 'Invalid action',
            });
        }

        await wishlist.save();

        return res.status(200).json({
            message: `Wishlist updated successfully (action: ${action})`,
            wishlist: wishlist.items,
        });
    } catch (e) {
        return res.status(500).json({
            message: 'database error, failed to update wishlist',
        });
    }
}

module.exports = {
    getWishlistItems,
    updateWishlistItem,
}
