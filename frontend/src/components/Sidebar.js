import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart'; 
import { message, Image, Popconfirm, Button as AntButton, Row, Col, InputNumber, Drawer } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import '../styles/sidebar.css';

const Sidebar = React.forwardRef(({
    mode,
    cartItems = [],
    wishlistItems = [],
    cartTotal = 0,
    wishlistLoading = false,
    wishlistError = null,
    removeFromWishlistHandler,
    removeFromCartHandler,
    onClose, // Renamed from implicit onClose to explicit prop for Drawer
}, ref) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, getCartItemQuantity } = useCart();
    const location = useLocation();

    const [addingItemId, setAddingItemId] = useState(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);

    const isVisible = mode !== null;

    const handleShowQuantityInput = (itemId) => {
        setAddingItemId(itemId); // itemId here will be item._id
        setQuantityToAdd(1); 
    };

    const handleCancelQuantityInput = () => {
        setAddingItemId(null);
        setQuantityToAdd(1);
    };

    const handleConfirmQuantityInput = (item) => { // item is a wishlist item, expected to have ._id
        if (!user) {
            message.info("Please log in to add items to the cart.");
            navigate('/auth', { state: { from: `${location.pathname}` } });
            setAddingItemId(null);
            return;
        }
        // Ensure item has _id, stock, and price. Title is used for messages.
        if (!item || typeof item._id === 'undefined' || typeof item.stock === 'undefined' || typeof item.price === 'undefined') {
            console.error("Wishlist item data is incomplete:", item);
            message.error("Cannot add item: essential data missing.");
            setAddingItemId(null);
            return;
        }

        const requestedQuantity = Number(quantityToAdd);
        if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
            message.error("Please enter a valid quantity greater than 0.");
            return;
        }

        const currentCartQuantity = getCartItemQuantity(item._id);
        const availableStock = item.stock;
        const availableToAdd = availableStock - currentCartQuantity;

        if (availableStock <= 0) {
            message.info(`Sorry, '${item.title}' is currently out of stock.`);
            setAddingItemId(null);
            return;
        }

        if (requestedQuantity > availableToAdd) {
            message.warning(`You can only add ${availableToAdd > 0 ? availableToAdd : 0} more of '${item.title}' (Stock: ${availableStock}, In Cart: ${currentCartQuantity}).`);
             setQuantityToAdd(availableToAdd > 0 ? availableToAdd : 1);
            return;
        }

        try {
            const newTotalQuantity = currentCartQuantity + requestedQuantity;
            addToCart(item, newTotalQuantity);
            message.success(`Moved '${item.title}' to cart.`); // Provide feedback
            removeFromWishlistHandler(item._id); // Remove from wishlist after adding to cart

            setAddingItemId(null);
            setQuantityToAdd(1);

        } catch (error) {
            console.error("Add to cart from wishlist (confirm step) error:", error);
            message.error(`Failed to add item to cart: ${error.message || 'Please try again.'}`);
            setAddingItemId(null);
        }
    };


    const handleCheckout = () => {
        navigate('/checkout');
    };

    const renderCartItem = (item) => (
        <div key={`cart-${item.id}`} className="sidebar__item"> {/* Assuming cart item.id is correctly mapped _id */}
            <Row gutter={12} align="middle" style={{ width: '100%' }}> {/* Changed align to middle for better visual balance */}
                <Col flex="72px"> {/* Fixed width for image column (60px image + 12px gutter) */}
                    <Image
                        src={`http://localhost:3000/images/${item.image}`}
                        alt={item.title}
                        className="sidebar__item-image"
                        width={60} height={60} // Explicit size for consistency
                        fallback="http://localhost:3000/images/Apple.jepg"
                        preview={false}
                    />
                </Col>
                <Col flex="auto"> 
                    <div className="sidebar__item-details">
                        <span className="sidebar__item-title">{item.title}</span>
                        <span className="sidebar__item-price">${item.price?.toFixed(2)}</span> {/* Added brand for cart as well for consistency if desired, or remove if not */}
                        <div className="sidebar__item-quantity">Qty: {item.quantity}</div>
                    </div>
                </Col>
                {removeFromCartHandler && (
                    <Col flex="40px">
                        <Popconfirm
                            title="Remove this item from your cart?"
                            onConfirm={() => removeFromCartHandler(item.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <AntButton type="text" danger icon={<DeleteOutlined />} className="sidebar__item-remove" aria-label={`Remove ${item.title} from cart`}>
                            </AntButton>
                        </Popconfirm>
                    </Col>
                )}
            </Row>
        </div>
    );

    const renderWishlistItem = (item) => {
        const isAddingThisItem = addingItemId === item._id; // Use item._id
        const currentCartQuantity = getCartItemQuantity(item._id); // Use item._id
        const remainingStockForAdding = Math.max(0, (item.stock ?? 0) - currentCartQuantity);
        console.log(item)


        return (
            <div key={`wishlist-${item._id}`} className="sidebar__item"> {/* Use item._id */}
                <Row gutter={12} align="middle" style={{ width: '100%' }}>
                    <Col flex="72px">
                        <Image
                            width={60}
                            height={60}
                            src={`http://localhost:3000/images/${item.image}`}
                            alt={item.title}
                            className="sidebar__item-image"
                            fallback="http://localhost:3000/images/Apple.jepg" // Consistent fallback
                            preview={false}
                        />
                    </Col>
                    <Col flex="auto">
                        <div className="sidebar__item-details">
                            <span className="sidebar__item-title">{item.title}</span>
                            <span className="sidebar__item-brand">Brand: {item.brand || 'N/A'}</span>
                            <span className="sidebar__item-price">${item.price?.toFixed(2)}</span>

                            {!isAddingThisItem ? (
                                <AntButton
                                    type="primary"
                                    ghost
                                    size="small"
                                    onClick={() => handleShowQuantityInput(item._id)} // Use item._id
                                    className="sidebar__wishlist-add-to-cart"
                                    disabled={remainingStockForAdding <= 0 || (item.stock ?? 0) <= 0}
                                    title={remainingStockForAdding <= 0 ? 'Out of stock or max in cart' : undefined}
                                >
                                    Add to Cart
                                </AntButton>
                            ) : (
                                <div className="sidebar__item-quantity-input-container">
                                    <InputNumber
                                        id={`sidebar-qty-${item._id}`} // Use item._id
                                        className="sidebar__item-quantity-input"
                                        size="small"
                                        value={quantityToAdd}
                                        onChange={(value) => {
                                            setQuantityToAdd(value === null || value < 1 ? 1 : value);
                                        }}
                                        onBlur={() => {
                                            if (quantityToAdd === null || quantityToAdd === '' || quantityToAdd < 1) setQuantityToAdd(1);
                                            if (remainingStockForAdding > 0 && quantityToAdd > remainingStockForAdding) {
                                                message.warning(`Only ${remainingStockForAdding} more of '${item.title}' available.`);
                                                setQuantityToAdd(remainingStockForAdding > 0 ? remainingStockForAdding : 1);
                                            }
                                        }}
                                        min={1}
                                        max={remainingStockForAdding > 0 ? remainingStockForAdding : undefined} // Allow adding 1 even if stock is 0 to trigger message
                                        step={1}
                                        autoFocus
                                    />
                                    <AntButton type="text" onClick={() => handleConfirmQuantityInput(item)} className="sidebar__item-confirm-button" icon={<CheckOutlined />} />
                                    <AntButton type="text" onClick={handleCancelQuantityInput} className="sidebar__item-cancel-button" icon={<CloseOutlined />} />
                                </div>
                            )}
                        </div>
                    </Col>
                    {removeFromWishlistHandler && (
                        <Col flex="40px">
                            <Popconfirm
                                title={`Remove "${item.title}" from your wishlist?`}
                                onConfirm={() => removeFromWishlistHandler(item._id)} // Use item._id
                                okText="Yes"
                                cancelText="No"
                            >
                                <AntButton
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    className="sidebar__item-remove"
                                    aria-label={`Remove ${item.title} from wishlist`}
                                />
                            </Popconfirm>
                        </Col>
                    )}
                </Row>
            </div>
        );
    };
    
    const drawerTitle = mode === 'cart' ? 'Your Cart' : (mode === 'wishlist' ? 'Your Wishlist' : '');

    const drawerFooter = mode === 'cart' && cartItems.length > 0 ? (
        <div style={{ textAlign: 'right' }}>
            <div className="sidebar__total" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
            </div>
            <AntButton type="primary" onClick={handleCheckout} className="sidebar__checkout-button">
                Proceed to Checkout
            </AntButton>
        </div>
    ) : null;

    return (
        <Drawer
            ref={ref}
            title={drawerTitle}
            placement="right"
            onClose={onClose}
            open={isVisible}
            width={378} // A common sidebar width, adjust as needed
            destroyOnClose // Resets state when closed
            footer={mode === 'cart' ? drawerFooter : null} // Footer only for cart
            bodyStyle={{ padding: '16px' }} // Adjust padding for content area
        >
            {mode === 'cart' && (
                cartItems.length > 0 ? cartItems.map(renderCartItem) : <p className="sidebar__empty-message">Your cart is empty.</p>
            )}
            {mode === 'wishlist' && (
                 <>
                     {wishlistLoading && <p className="sidebar__loading-message">Loading wishlist...</p>}
                     {!wishlistLoading && wishlistError && <p className="sidebar__error-message">{wishlistError}</p>}
                     {!wishlistLoading && !wishlistError && wishlistItems.length === 0 && <p className="sidebar__empty-message">Your wishlist is empty.</p>}
                     {!wishlistLoading && !wishlistError && wishlistItems.length > 0 && wishlistItems.map(renderWishlistItem)}
                 </>
            )}
        </Drawer>
    );
});

export default Sidebar;