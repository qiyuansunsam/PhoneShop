import React, { useState, useEffect, useMemo, use } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { message, Image } from 'antd';
import { useCart } from '../hooks/useCart';

import Review from './Review';
import * as api from '../services/api';
import '../styles/ItemDetailModal.css';


function ItemDetailModal({ initialItem, onClose, onReviewPosted, onItemUpdate }) {
    const { user } = useAuth();
    const { addToCart, getCartItemQuantity, wishlistItems, addToWishlist: contextAddToWishlist } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const [itemData, setItemData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [visibleReviewCount, setVisibleReviewCount] = useState(3);
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [showQuantityInput, setShowQuantityInput] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);

    const currentReviews = useMemo(() => itemData?.reviews || [], [itemData]);

    useEffect(() => {
        if (!initialItem || !initialItem._id) {
            setIsLoading(false);
            setError("Item data not provided or invalid.");
            setItemData(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        const enrichAndSetItemData = async () => {
            let reviewsToProcess = initialItem.reviews || [];
            let enrichedReviews = reviewsToProcess;

            if (reviewsToProcess.length > 0) {
                const reviewerNameCache = new Map()
                enrichedReviews = await Promise.all(
                    reviewsToProcess.map(async (review) => {
                        let reviewerFullName = String(review.reviewer);
                        if (review.reviewer && !reviewerNameCache.has(String(review.reviewer))) {
                            try {
                                const userData = await api.getUserNameById(String(review.reviewer));
                                reviewerFullName = userData.username || String(review.reviewer);
                                reviewerNameCache.set(String(review.reviewer), reviewerFullName);
                            } catch (e) {
                                console.warn(`Could not fetch username for reviewer ${review.reviewer}:`, e);
                                reviewerNameCache.set(String(review.reviewer), String(review.reviewer));
                            }
                        } else if (review.reviewer) {
                            reviewerFullName = reviewerNameCache.get(String(review.reviewer)) || String(review.reviewer);
                        }
                        return { ...review, reviewerFullName };
                    })
                );
            }

            setItemData({
                ...initialItem,
                reviews: enrichedReviews,
            });

            setVisibleReviewCount(3);
            setShowQuantityInput(false);
            setQuantityToAdd(1);
            setIsLoading(false); 
        };

        enrichAndSetItemData().catch(err => {
            console.error("Error setting item data with enriched reviews:", err);
            setItemData({ ...initialItem, reviews: initialItem.reviews || [] });
            setIsLoading(false);
            setError("Could not load full item details, including reviewer names.");
        });

    }, [initialItem, user]);

    useEffect(() => {
        setIsWishlistLoading(true);
        if (user && wishlistItems && initialItem?._id) {
            const itemIsInWishlist = wishlistItems.some(
                (wishlistItem) => String(wishlistItem._id) === String(initialItem._id)
            );
            setIsWishlisted(itemIsInWishlist);
        } else {
            setIsWishlisted(false);
        }
        setIsWishlistLoading(false);
    }, [initialItem, user, wishlistItems]);

    const handleToggleReviewVisibilityInModal = async (reviewToToggle) => {
        if (!itemData || !itemData._id) {
            message.error("Item data is not available to toggle review visibility.");
            return;
        }

        if (!reviewToToggle || typeof reviewToToggle.reviewer === 'undefined') {
            message.error("Could not find the review to toggle.");
            return;
        }

        const isActuallyHidden = String(reviewToToggle.hidden).toLowerCase() === 'true';
        const newVisibility = !isActuallyHidden;
        const reviewerId = String(reviewToToggle.reviewer); 

        try {
            const response = await api.toggleReviewVisibility(itemData._id, reviewerId, newVisibility);
            message.success(response.message || `Review visibility updated successfully.`);
            
            const updatedItem = {
                ...itemData,
                reviews: (itemData.reviews || []).map(r =>
                    String(r.reviewer) === String(reviewToToggle.reviewer) ? { ...r, hidden: newVisibility } : r
                )
            };
            setItemData(updatedItem);

            if (onItemUpdate) {
                onItemUpdate(updatedItem);
            }

        } catch (err) {
            console.error("Failed to toggle review visibility:", err);
            message.error(err.message || "Could not update review visibility. Please try again.");
        }
    };

    const handleShowMoreReviews = () => {
        setVisibleReviewCount(prevCount => prevCount + 3);
    };

    const handleAddToCartClick = () => {
        if (!user) {
            handleLoginRedirect();
            return;
        }
        if (itemData && itemData.stock > 0) {
            const currentCartQuantity = getCartItemQuantity(itemData._id);
            if (currentCartQuantity >= itemData.stock) {
                message.warning(`You already have the maximum available stock (${itemData.stock}) in your cart.`);
                return;
            }
            setQuantityToAdd(1);
            setShowQuantityInput(true);
        } else if (itemData) {
            message.info("This item is currently out of stock.");
        }
    };

    const handleConfirmAddToCart = () => {
        if (!itemData || !user) return;

        const requestedQuantity = Number(quantityToAdd);
        // Correctly check if quantityToAdd is literally "+" or "-" or if Number(quantityToAdd) is NaN
        if (isNaN(requestedQuantity) || quantityToAdd === '+' || quantityToAdd === '-') {
            message.error("Quantity must be a valid number."); // This message is appropriate
            return;
        }

        // Then check if the valid number is greater than 0
        if (requestedQuantity <= 0) {
            message.error("Please enter a valid quantity greater than 0.");
            return;
        }
        const currentCartQuantity = getCartItemQuantity(itemData._id);
        const availableStock = itemData.stock;
        const availableToAdd = availableStock - currentCartQuantity;

        if (requestedQuantity > availableToAdd) {
            message.warning(`You can only add ${availableToAdd} more of this item (Stock: ${availableStock}, Already in Cart: ${currentCartQuantity}). Maximum stock reached.`);
             setQuantityToAdd(availableToAdd > 0 ? availableToAdd : 1);
            return;
        }

        try {
            const newTotalQuantity = currentCartQuantity + requestedQuantity;
            addToCart(itemData, newTotalQuantity);
            message.success(`${requestedQuantity} x "${itemData.title}" added to cart.`);

            setShowQuantityInput(false);
            setQuantityToAdd(1); 
        } catch (error) {
            console.error("Add to cart error:", error);
            alert(`Failed to add item to cart: ${error.message || 'Please try again.'}`);
        }
    };


    const handleCancelAddToCart = () => {
        setShowQuantityInput(false);
        setQuantityToAdd(1);
    };


    const handleAddToWishlist = async () => {
        if (!itemData || isWishlisted) return;
        if (!user) {
            handleLoginRedirect();
            return;
        }
        setIsWishlistLoading(true);
        setError(null);
        try {
            await contextAddToWishlist(itemData);
            message.success('Item added to your wishlist!');

        } catch (err) {
            if (err.message && err.message.toLowerCase().includes('already in wishlist')) {
                 setIsWishlisted(true);
                 setError("This item is already in your wishlist.");
            } else {
                setError(`Could not add item to wishlist: ${err.message || 'Server error.'}. Please try again.`);
            }
        } finally {
             setIsWishlistLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        message.info("Please log in to perform this action.");
        const fromPath = location.pathname.includes('/item/') ? location.pathname : `/item/${initialItem?._id}`;
        const searchParams = location.search;
        navigate('/auth', { state: { from: `${fromPath}${searchParams}` } });
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!user) {
            handleLoginRedirect();
            return;
        }
        if (!newComment.trim()) {
            message.error("Please enter a comment.");
            return;
        }
        const payloadForApi = {
            reviewData: {
                _id: itemData._id,
                reviewer: user.id,
                comment: newComment,
                rating: newRating
            }
        };

        try {
            const response = await api.postReview(payloadForApi); 

            if (response && response.message) {
                message.success(response.message);
                setNewComment('');
                setNewRating(5);

                let reviewToUpdateUIWith;

                if (response.review) {
                    reviewToUpdateUIWith = response.review;
                } else {
                    console.warn("Review posted, but full review data was not returned by the server. Performing optimistic update.");
                    reviewToUpdateUIWith = {
                        _id: `optimistic-${Date.now()}`,
                        reviewer: String(user.id),
                        comment: newComment,
                        rating: newRating,
                        hidden: false,
                        reviewerFullName: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email : 'You',
                    };
                }

                if (reviewToUpdateUIWith && typeof reviewToUpdateUIWith.reviewer !== 'undefined') {
                    setItemData(prevItemData => {
                        if (!prevItemData) return null;
                        return { ...prevItemData, reviews: [...(prevItemData.reviews || []), reviewToUpdateUIWith] };
                    });
                    if (onReviewPosted) {
                        onReviewPosted(itemData._id, reviewToUpdateUIWith);
                    }
                } else {
                    console.error("Failed to prepare review data for UI update even after optimistic attempt.", response);
                    message.error("Review posted, but couldn't update the display immediately. Please refresh.");
                }
            } else {
                const errorMessage = response && response.message ? response.message : "Review posting failed with an unexpected response.";
                message.error(errorMessage);
                console.warn("Review posting failed or returned an unexpected response:", response);
            }
        } catch (err) {
            console.error("Failed to post review:", err);
            message.error(err.message || "Could not post review. Please try again.");
        }
    };


    if (isLoading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content modal-loading" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-button" onClick={onClose} aria-label="Close item details">&times;</button>
                    <p>Loading item details...</p>
                </div>
            </div>
        );
    }

    if (error && !itemData && !isLoading) { 
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content modal-error" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-button" onClick={onClose} aria-label="Close item details">&times;</button>
                    <p className="error-message">{error}</p>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

     if (!itemData && !isLoading) {
         return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-button" onClick={onClose} aria-label="Close item details">&times;</button>
                    <p>Item not found or is unavailable.</p>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    if (!itemData) {
        return null;
    }

    const currentCartQuantity = getCartItemQuantity(itemData._id);
    const canAddToCart = itemData.stock > 0;
    const remainingStockForAdding = Math.max(0, itemData.stock - currentCartQuantity);
    const canAddToKartButtonEnabled = canAddToCart && remainingStockForAdding > 0;
    const sellerName = itemData.sellerName || (itemData.seller ? `${itemData.seller.firstName || ''} ${itemData.seller.lastName || ''}`.trim() || 'Seller Profile Incomplete' : 'Unknown Seller');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} aria-label="Close item details">&times;</button>
                {error && <p className="error-message modal-error-persistent">{error}</p>}

                <div className="item-main-info">
                    <div className="item-image-container">
                        <Image
                            src={`http://localhost:3000/images/${itemData.image}`}
                            alt="Listing image"
                            className="item-image-large"
                            fallback="http://localhost:3000/images/Apple.jepg"
                        />
                    </div>
                    <div className="item-details-and-actions-wrapper">
                        <div className="item-details">
                            <h1>{itemData.title}</h1>
                            <p><strong>Brand:</strong> {itemData.brand || 'N/A'}</p>
                            <p><strong>Price:</strong> ${itemData.price?.toFixed(2)}</p>
                            <p><strong>Available Stock:</strong> {itemData.stock > 0 ? itemData.stock : 'Out of Stock'}</p>
                            <p><strong>Seller:</strong> {sellerName}</p>
                            <p><strong>Currently in Your Cart:</strong> {currentCartQuantity}</p>
                        </div>

                        <div className="item-actions">
                            {!showQuantityInput ? (
                                <>
                                    {canAddToCart ? (
                                        <button
                                            onClick={handleAddToCartClick}
                                            disabled={!canAddToKartButtonEnabled}
                                            title={!canAddToKartButtonEnabled && itemData.stock > 0 ? `Maximum available stock (${itemData.stock}) already in cart` : undefined}
                                        >
                                            Add to Cart
                                        </button>
                                    ) : (
                                        <button disabled>Out of Stock</button>
                                    )}
                                </>
                            ) : (
                                <div className="quantity-input-container">
                                    <label htmlFor={`quantity-${itemData._id}`}>Qty:</label>
                                    <input
                                        type="number"
                                        id={`quantity-${itemData._id}`}
                                        value={quantityToAdd}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                 setQuantityToAdd('');
                                            } else {
                                                const num = parseInt(val, 10);
                                                if (!isNaN(num) && num >= 1) {
                                                   const maxAllowed = remainingStockForAdding > 0 ? remainingStockForAdding : 1;
                                                   setQuantityToAdd(Math.min(num, maxAllowed));
                                                } else if (!isNaN(num) && num < 1) {
                                                    setQuantityToAdd(1);
                                                }
                                            }
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value === '' || isNaN(parseInt(e.target.value, 10)) || parseInt(e.target.value, 10) < 1) {
                                                setQuantityToAdd(1);
                                            } else {
                                                const num = parseInt(e.target.value, 10);
                                                const maxAllowed = remainingStockForAdding > 0 ? remainingStockForAdding : 1;
                                                if (num > maxAllowed) {
                                                    message.warning(`Only ${maxAllowed} more available.`);
                                                    setQuantityToAdd(maxAllowed);
                                                }
                                            }
                                        }}
                                        min="1"
                                        max={remainingStockForAdding > 0 ? remainingStockForAdding : undefined}
                                        step="1"
                                        className="quantity-input"
                                        autoFocus
                                        required
                                    />
                                    <button onClick={handleConfirmAddToCart} className="button-confirm">Confirm Add</button>
                                    <button onClick={handleCancelAddToCart} className="button-secondary">Cancel</button>
                                </div>
                            )}

                            <button
                                onClick={handleAddToWishlist}
                                disabled={isWishlisted || isWishlistLoading}
                                className={isWishlisted ? 'button-wishlisted' : ''}
                                title={isWishlisted ? "This item is in your wishlist" : "Add this item to your wishlist"}
                            >
                                {isWishlistLoading ? 'Adding...' : (isWishlisted ? 'Wishlisted' : 'Add to Wishlist')}
                            </button>
                        </div>
                    </div>
                </div>

                <hr className="section-separator" />

                {(() => {
                    const effectiveUserId = user ? String(user.id) : '0'; 
                    const reviewsToShow = currentReviews.filter(review => !(review.hidden && String(review.hidden).toLowerCase() === 'true') || (String(review.reviewer) === effectiveUserId));

                    return (
                <div className="item-reviews-section">
                            <h2>Reviews ({reviewsToShow.length})</h2>
                            {reviewsToShow.length > 0 ? (
                                reviewsToShow
                            .slice(0, visibleReviewCount)
                            .map((review, index) => {
                            const canToggle = user && review.reviewer &&
                                (String(review.reviewer) === String(user.id) ||
                                 (itemData.seller && String(itemData.seller.id) === String(user.id)));
                            return (
                                <Review
                                    key={review._id || `review-item-${index}-${review.reviewer}`}
                                    review={review}
                                    canToggle={canToggle}
                                    onToggleVisibility={handleToggleReviewVisibilityInModal}
                                    itemData={itemData} 
                                />
                            );
                        })
                            ) : (
                                <p>No reviews yet for this item.</p>
                            )}
                            {reviewsToShow.length > visibleReviewCount && (
                                <button onClick={handleShowMoreReviews} className="show-more-reviews-btn">Show More Reviews</button>
                            )}
                </div>
                    );
                })()}

                <hr className="section-separator" />

                <div className="add-review-container">
                     <h2>Write a Review</h2>
                    {user ? (
                        <form onSubmit={handlePostComment} className="add-review-form">
                            <div className="form-group">
                                <label htmlFor={`rating-${itemData._id}`}>Your Rating:</label>
                                <select id={`rating-${itemData._id}`} value={newRating} onChange={(e) => setNewRating(Number(e.target.value))} required>
                                    <option value="5">★★★★★</option>
                                    <option value="4">★★★★☆</option>                                   
                                    <option value="3">★★★☆☆</option>
                                    <option value="2">★★☆☆☆</option>
                                    <option value="1">★☆☆☆☆</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor={`comment-${itemData._id}`}>Your Comment:</label>
                                <textarea
                                    id={`comment-${itemData._id}`}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows="4"
                                    maxLength="500"
                                    required
                                    placeholder="Share your thoughts about the item..."
                                />
                                 <small>{Math.max(0, 500 - newComment.length)} characters remaining</small>
                            </div>
                            <button type="submit">Post Review</button>
                        </form>
                    ) : (
                        <div className="add-review-login-prompt">
                            <p>Please <button onClick={handleLoginRedirect} className="link-button">log in</button> to write a review.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default ItemDetailModal;