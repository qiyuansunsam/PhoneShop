import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { message, Popconfirm, Button } from 'antd';
import * as api from '../services/api';
import Sidebar from './Sidebar';
import '../styles/topbar.css';

function TopBar() {
    const [sidebarMode, setSidebarMode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const { user, logout } = useAuth();

    const {
        cartItems,
        getCartTotal,
        itemCount,
        removeFromCart,
        wishlistItems,
        wishlistLoading,
        wishlistError,
        fetchWishlist,
        removeFromWishlist: contextRemoveFromWishlist
    } = useCart();

    const topBarRef = useRef(null);
    const wishlistButtonRef = useRef(null);
    const cartButtonRef = useRef(null);
    const sidebarRef = useRef(null);

    const [topBarHeight, setTopBarHeight] = useState(0);
    const [wishlistButtonRect, setWishlistButtonRect] = useState(null);

    const updateElementPositions = useCallback(() => {
        setTopBarHeight(topBarRef.current?.offsetHeight ?? 0);
        setWishlistButtonRect(wishlistButtonRef.current?.getBoundingClientRect() ?? null);
    }, []);

    useEffect(() => {
        updateElementPositions();
        window.addEventListener('resize', updateElementPositions);
        return () => window.removeEventListener('resize', updateElementPositions);
    }, [updateElementPositions]);

    useEffect(() => {
        if (user && sidebarMode === 'wishlist') {
             fetchWishlist();
        } else if (!user) {
        }
    }, [user, sidebarMode, fetchWishlist]);



    const handleSearchChange = (event) => setSearchTerm(event.target.value);
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const trimmedSearchTerm = searchTerm.trim();
        if (trimmedSearchTerm) {
            navigate(`/search?q=${encodeURIComponent(trimmedSearchTerm)}`);
            setSearchTerm('');
        }
     };

    const toggleSidebar = (mode) => {
        if (sidebarMode === mode) {
            setSidebarMode(null);
        } else {
            if (mode === 'wishlist') {
                if (user) {
                    fetchWishlist();
                } else {
                }
            }
            updateElementPositions();
            setSidebarMode(mode);
        }
    };
    const closeSidebar = useCallback(() => {
        setSidebarMode(null);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
                wishlistButtonRef.current && !wishlistButtonRef.current.contains(event.target) &&
                cartButtonRef.current && !cartButtonRef.current.contains(event.target)
               ) {
                closeSidebar();
            }
        };
        if (sidebarMode !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarMode, closeSidebar]);

    const handleRemoveFromWishlist = async (itemId) => {
        try {
            await contextRemoveFromWishlist(itemId);
        } catch (error) {
            console.error("Failed to remove item from wishlist:", error);
            message.error(`Could not remove item from wishlist: ${error.message}`);
        }
    };

    const handleRemoveFromCart = (itemId) => {
        removeFromCart(itemId);
    };

    const handleLogout = async () => {
        try {
            await logout();
            closeSidebar();
        } catch (error) {
            console.error("Logout failed:", error);
            message.error("Logout failed. Please try again.");
        }
    };

    return (
        <>
            <nav className="top-bar" ref={topBarRef}>
                <Link to="/" className="top-bar__title">OldPhoneDeals</Link>
                <div className="top-bar__middle">
                    <form onSubmit={handleSearchSubmit} className="top-bar__search-form">
                        <input type="search" className="top-bar__search-input" placeholder="Search phones..." value={searchTerm} onChange={handleSearchChange} aria-label="Search phones"/>
                    </form>
                </div>
                <div className="top-bar__actions">
                    {user ? (
                        <>
                            <Link to="/profile" className="top-bar__link">Profile</Link>
                            <span className="top-bar__separator" aria-hidden="true"></span>
                            <Popconfirm
                                title="Are you sure you want to logout?"
                                onConfirm={handleLogout}
                                okText="Yes"
                                cancelText="No"
                            >
                                <button className="top-bar__text-button">Logout</button>
                            </Popconfirm>
                        </>
                    ) : (
                        <>
                            <Link to="/register" className="top-bar__link">Register</Link>
                            <span className="top-bar__separator" aria-hidden="true"></span>
                            <Link to="/auth" className="top-bar__link">Sign In</Link>
                        </>
                    )}
                    <span className="top-bar__separator" aria-hidden="true"></span>

                    <button
                        ref={wishlistButtonRef}
                        className={`top-bar__text-button ${sidebarMode === 'wishlist' ? 'top-bar__text-button--active' : ''}`}
                        onClick={() => toggleSidebar('wishlist')}
                        aria-label={`Wishlist (${user ? wishlistItems.length : 0} items)`}
                        aria-expanded={sidebarMode === 'wishlist'}
                    >
                        Wishlist
                        {user && wishlistItems.length >= 0 && (
                             <span className="top-bar__item-count top-bar__wishlist-count">{wishlistItems.length}</span>
                        )}
                        {user && wishlistLoading && (
                             <span className="top-bar__item-count top-bar__item-count--loading">...</span>
                        )}
                    </button>

                    <span className="top-bar__separator" aria-hidden="true"></span>

                    <button
                        ref={cartButtonRef}
                        className={`top-bar__text-button ${sidebarMode === 'cart' ? 'top-bar__text-button--active' : ''}`}
                        onClick={() => toggleSidebar('cart')}
                        aria-label={`Cart (${itemCount} items)`}
                        aria-expanded={sidebarMode === 'cart'}
                    >
                        Cart
                        {itemCount >= 0 && (
                            <span className="top-bar__item-count">{itemCount}</span>
                        )}
                    </button>
                </div>
            </nav>

            <Sidebar
                ref={sidebarRef}
                mode={sidebarMode}
                topBarHeight={topBarHeight}
                wishlistButtonRect={wishlistButtonRect}
                cartItems={cartItems}
                wishlistItems={wishlistItems}
                cartTotal={getCartTotal()}
                wishlistLoading={wishlistLoading}
                wishlistError={wishlistError}
                removeFromWishlistHandler={handleRemoveFromWishlist}
                removeFromCartHandler={handleRemoveFromCart}
                isUserLoggedIn={!!user}
                onClose={closeSidebar}
            />
        </>
    );
}

export default TopBar;