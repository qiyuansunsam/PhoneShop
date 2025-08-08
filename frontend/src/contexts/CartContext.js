import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { user } = useAuth();

    const [cartItems, setCartItems] = useState([]);
    const [cartLoading, setCartLoading] = useState(false);
    const [cartError, setCartError] = useState(null);

    const [wishlistItems, setWishlistItems] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlistError, setWishlistError] = useState(null);

    const fetchCartItems = useCallback(async (showLoadingIndicator = true) => {
        if (!user) {
            setCartItems([]);
            return;
        }
        if (showLoadingIndicator) setCartLoading(true);
        setCartError(null);
        try {
            const response = await api.getCartItems(); 
            const cartProducts = response.carts?.products || [];
            const itemDetailsList = response.items || [];

            const itemDetailsMap = new Map(itemDetailsList.map(item => [String(item._id), item]));

            const processedCartItems = cartProducts.map(cartProduct => {
                const details = itemDetailsMap.get(String(cartProduct._id));
                if (details) {
                    return {
                        ...details, 
                        id: String(details._id),
                        quantity: cartProduct.quantity, 
                    };
                }
                return null;
            }).filter(item => item !== null);
            setCartItems(processedCartItems);
        } catch (error) {
            console.error("CartContext: Failed to fetch cart items:", error);
            setCartError("Could not load cart items.");
            setCartItems([]);
        } finally {
            if (showLoadingIndicator) setCartLoading(false);
        }
    }, [user]);

    const fetchWishlist = useCallback(async (showLoadingIndicator = true) => {
        if (!user) {
            setWishlistItems([]);
            if (showLoadingIndicator) setWishlistLoading(false);
            return;
        }
        if (showLoadingIndicator) setWishlistLoading(true);
        setWishlistError(null);
        try {
            const items = await api.getWishlistItems();
            console.log(items)
            setWishlistItems(items.wishlist || []);
        } catch (error) {
            console.error("CartContext: Failed to fetch wishlist:", error);
            setWishlistError("Could not load wishlist.");
            setWishlistItems([]);
        } finally {
            if (showLoadingIndicator) setWishlistLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCartItems(false);
        fetchWishlist(false);
    }, [user, fetchCartItems, fetchWishlist]);

    const contextAddToCart = async (item, newTotalQuantity) => {
        if (!user) throw new Error("Please log in to add items to your cart.");
        if (!item || typeof item._id === 'undefined') throw new Error("Invalid item data.");
        setCartLoading(true);
        try {
            await api.updateCartItem(item._id, newTotalQuantity);
            await fetchCartItems(false);
            return true;
        } catch (error) {
            console.error("CartContext: Failed to add/update item in cart:", error);
            setCartError(error.message || "Could not update cart.");
            await fetchCartItems(false);
            throw error;
        } finally {
            setCartLoading(false);
        }
    };

    const contextUpdateQuantity = async (itemId, newQuantity) => {
        if (!user) throw new Error("Please log in to update cart quantities.");
        setCartLoading(true);
        try {
            await api.updateCartItem(itemId, newQuantity);
            await fetchCartItems(false);
            return true;
        } catch (error) {
            console.error("CartContext: Failed to update item quantity:", error);
            setCartError(error.message || "Could not update item quantity.");
            await fetchCartItems(false);
            throw error;
        } finally {
            setCartLoading(false);
        }
    };

    const contextRemoveFromCart = async (itemId) => {
        if (!user) throw new Error("Please log in to remove items from your cart.");
        setCartLoading(true);
        const itemToRemove = cartItems.find(item => item.id === itemId);
        if (!itemToRemove) {
            console.warn(`CartContext: Item with ID ${itemId} not found in cart for removal.`);
            setCartLoading(false);
            return false; // Or throw an error
        }
        try {
            console.log(-itemToRemove.quantity)
            await api.updateCartItem(itemId, -itemToRemove.quantity); // Send negative current quantity
            await fetchCartItems(false);
            return true;
        } catch (error) {
            console.error("CartContext: Failed to remove item from cart:", error);
            setCartError(error.message || "Could not remove item from cart.");
            await fetchCartItems(false);
            throw error;
        } finally {
            setCartLoading(false);
        }
    };

    const contextClearCart = async () => {
        if (!user) throw new Error("Please log in to clear your cart.");
        setCartLoading(true);
        try {
            for (const item of cartItems) {
                await api.updateCartItem(item.id, -item.quantity);
            }
            await fetchCartItems(false);
            return true;
        } catch (error) {
            console.error("CartContext: Failed to clear cart:", error);
            setCartError(error.message || "Could not clear cart.");
            await fetchCartItems(false);
            throw error;
        } finally {
            setCartLoading(false);
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartItemQuantity = (itemId) => {
        const item = cartItems.find(cartItem => cartItem._id === itemId);
        return item ? item.quantity : 0;
    }

    const contextAddToWishlist = async (itemData) => {
        if (!itemData || typeof itemData._id === 'undefined') throw new Error("Invalid item data for wishlist.");
        if (!user) throw new Error("Please log in to add items to your wishlist.");
        setWishlistLoading(true);
        try {
            await api.updateWishlistItem(itemData._id, 'add');
            await fetchWishlist(false);
            return true;
        } catch (error) {
            console.error("CartContext: Failed to add to wishlist:", error);
            setWishlistError(error.message || "Could not add to wishlist.");
            await fetchWishlist(false);
            throw error;
        } finally {
            setWishlistLoading(false);
        }
    };

    const contextRemoveFromWishlist = async (itemId) => {
        if (!user) throw new Error("User not logged in.");
        setWishlistLoading(true); 
        try {
            await api.updateWishlistItem(itemId, 'remove');
            await fetchWishlist(false);
            return true;
        } catch (error) {
            console.error("CartContext: Failed to remove from wishlist:", error);
            setWishlistError(error.message || "Could not remove item from wishlist.");
            await fetchWishlist(false);
            throw error;
        } finally {
            setWishlistLoading(false);
        }
    };

    const value = {
        cartItems,
        cartLoading,
        cartError,
        fetchCartItems,
        addToCart: contextAddToCart,
        updateQuantity: contextUpdateQuantity,
        removeFromCart: contextRemoveFromCart,
        clearCart: contextClearCart,
        getCartTotal,
        getCartItemQuantity,
        itemCount: cartItems.reduce((count, item) => count + (item.quantity || 0), 0),
        wishlistItems,
        wishlistLoading,
        wishlistError,
        fetchWishlist,
        addToWishlist: contextAddToWishlist, 
        removeFromWishlist: contextRemoveFromWishlist 
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};