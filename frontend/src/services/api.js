const API_BASE_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return response;
    }
}

// Auth
export const getUserNameById = async (userId) => request('/auth/username', { method: 'POST', body: JSON.stringify({ userId: userId }) });
export const checkAuthStatus = () => request('/auth/status');
export const loginUser = async (credentials) => {
    return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
};
export const registerUser = async (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const logout = async () => {
    try {
        await request('/auth/logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    }
};
export const requestPasswordReset = (email) => request('/auth/request-reset', { method: 'POST', body: JSON.stringify({ email }) });
export const resetPassword = (token, newPassword) =>
    request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
            token: token,
            new_password: newPassword
        })
    });



// Main
export const fetchSoldOutSoon = () => request('/phones/sold-out-soon');
export const fetchBestSellers = () => request('/phones/best-sellers');
export const searchItems = (queryString) => request(`/phones/search?${queryString}`);

// --- Cart ---
export const getCartItems = () => request('/cart');
export const updateCartItem = (itemId, quantity) => request('/cart/item', { method: 'POST', body: JSON.stringify({ itemId: itemId, quantity: quantity })});

// --- Wishlist ---
export const getWishlistItems = () => request('/wishlist');
export const updateWishlistItem = (itemId, action) => request('/wishlist/item', { method: 'POST', body: JSON.stringify({ itemId, action }) });

// --- Checkout ---
export const processOrder = (cartItems) => request('/orders', { method: 'POST', body: JSON.stringify({ items: cartItems }) });

// Reviews
export const postReview = (reviewData) => request('/reviews', { method: 'POST', body: JSON.stringify(reviewData) });
export const getUserReviews = () => request(`/reviews/getUserReview`);
export const toggleReviewVisibility = (phoneId, reviewer, hidden) => request(`/reviews/${phoneId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({
        reviewer: reviewer,
        isHidden: hidden
    })
});

// Profile
export const updateUserProfile = (requestData) => request('/profiles', { method: 'PATCH', body: JSON.stringify({requestData}) });
export const changePassword = (passwords) => request('/profiles/password', { method: 'POST', body: JSON.stringify(passwords) });

// Listings
export const getAllListings = () => request('/profiles/listings');
export const addListing = null
export const updateListing = (listingId, listingData) => request(`/profiles/listings/${listingId}`, { method: 'PUT', body: JSON.stringify(listingData) });
export const toggleListingStatus = (listingId, isEnabled) => request(`/profiles/listings/${listingId}/status`, { method: 'PATCH'});
export const deleteListing = (listingId) => request(`/profiles/listings/${listingId}`, { method: 'DELETE' });
export const getCommentsForUserListings = () => request('/profiles/listings/comments');


// === Admin APIs === Admin Features
// Accessible via a dedicated admin page:
// View all users and listings
// Search, edit, disable, or delete users/items
// Alert admin when an order is placed
// View hidden fields (e.g. last login, registration date)
// Access logs (e.g. sales history)

// === Admin Registration ===
export const adminRegister = (adminData) => request('/admin/register', {
    method: 'POST',
    body: JSON.stringify(adminData)
});

// Admin Login
export const adminLogin = (credentials) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
});

// Admin Logout
export const adminLogout = () => request('/admin/logout');

// Check Admin Session
export const checkAdminSession = () => request('/admin/status');

// === User Management ===
export const fetchAllUsers = (query = '') => request(`/admin/users?search=${query}`);
export const updateUserDetails = (userId, updates) => request(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
});
export const disableUser = (userId) => request(`/admin/users/${userId}/disable`, { method: 'PATCH' });
export const deleteUser = (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' });
export const getUserListingsAndReviews = (userId) => request(`/admin/users/${userId}/details`);

// === Listing Management ===
export const fetchAllListings = (query = '') => request(`/admin/listings?search=${query}`);
export const updateListingDetails = (listingId, updates) => request(`/admin/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
});
export const disableListing = (listingId) => request(`/admin/listings/${listingId}/disable`, { method: 'PATCH' });
export const deleteListingAdmin = (listingId) => request(`/admin/listings/${listingId}`, { method: 'DELETE' });
export const getListingReviewsAndSeller = (listingId) => request(`/admin/listings/${listingId}/details`);

// === Review Moderation ===
export const fetchAllReviews = (query = '') => request(`/admin/reviews?search=${query}`);
export const toggleReviewVisibilityAdmin = (phoneId, reviewer, isHidden) => request(`/admin/reviews/${phoneId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewer, isHidden })
});

// === Sales and Logs ===
export const fetchSalesLogs = () => request('/admin/sales');
export const exportSalesHistory = () => request(`/admin/sales/export`);
