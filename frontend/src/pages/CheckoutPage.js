import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { message, Image, Row, Col, InputNumber, Button } from 'antd'; // Added Image, Row, Col, InputNumber, Button
import * as api from '../services/api'
import '../styles/CheckoutPage.css';

// CartItem component remains the same as the previous version
function CartItem({ item, onUpdateQuantity, onRemoveItem }) {
    const [quantity, setQuantity] = useState(item.quantity);

    const handleQuantityChange = (value) => {
        const newQuantity = value === null || value < 0 ? 0 : value;
        setQuantity(newQuantity);
    };

    const handleUpdateClick = () => {
        if (quantity !== item.quantity || (quantity === 0 && item.quantity > 0)) {
            const availableStock = item.stock ?? Infinity;
            const effectiveQuantity = Math.min(quantity, availableStock);

            if (effectiveQuantity !== quantity) {
               setQuantity(effectiveQuantity);
               message.warning(`Only ${availableStock} items available in stock.`);
            }

            if (effectiveQuantity !== item.quantity) {
                onUpdateQuantity(item.id, effectiveQuantity);
            }
        } else if (quantity < 0) {
            setQuantity(item.quantity);
        }
    };

    const maxStockInput = typeof item.stock === 'number' ? item.stock : undefined;

    return (
      <div className="cart-item">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6} md={4} lg={3}>
            <Image
              width="100%"
              src={`http://localhost:3000/images/${item.image}`}
              alt={item.title}
              fallback="http://localhost:3000/images/Apple.jpeg"
              className="cart-item-image"
            />
          </Col>
          <Col xs={24} sm={18} md={12} lg={15}>
            <div className="cart-item-text-content">
              <h3 className="cart-item-title">{item.title}</h3>
              <p className="cart-item-price">Price: ${item.price?.toFixed(2)}</p>
              {typeof item.stock === 'number' && (
                  <p className="cart-item-stock">Available Stock: {item.stock}</p>
              )}
            </div>
          </Col>
          <Col xs={24} md={8} lg={6}>
            <div className="cart-item-actions">
              <div className="quantity-control">
                <label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity</label>
                <InputNumber
                  id={`quantity-${item.id}`}
                  min={0}
                  max={maxStockInput}
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleUpdateClick}
                  onPressEnter={handleUpdateClick}
                  className="cart-item-quantity-input"
                  aria-label={`Quantity for ${item.title}`}
                />
              </div>
              <Button
                type="link"
                danger
                onClick={() => onRemoveItem(item.id)}
                className="cart-item-remove-button"
                aria-label={`Remove ${item.title} from cart`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="remove-text">Remove</span>
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    );
 }


function CheckoutPage() {
    const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useContext(CartContext);
    const navigate = useNavigate();
    const total = getCartTotal();
    const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    const handleConfirmTransaction = async () => {
        console.log("Attempting to confirm transaction...");

        if (!cartItems || cartItems.length === 0) {
            console.warn("Cart is empty. Cannot confirm transaction.");
            message.warning("Your cart is empty. Please add items before checking out.");
            return;
        }

        const orderItemsPayload = cartItems.map(item => ({
            _id: item._id,
            number: item.quantity
        }));

        console.log("Processing order with payload:", orderItemsPayload);

        try {
            await api.processOrder(orderItemsPayload);

            console.log("Order processed successfully via API.");

            clearCart();
            console.log("Local cart cleared.");

            message.success("Checkout successful! Item and paid delivered under the assumption! Redirecting to homepage...");

            navigate('/');

        } catch (error) {
            console.error("Checkout failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
            message.error(`Checkout failed. ${errorMessage}`);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="checkout-container">
            {/* Use Row and Col for Back Button and Title */}
            <Row align="middle" gutter={[16, 16]}> {/* align="middle" centers vertically */}
                <Col xs={4} sm={3} md={2} style={{ textAlign: 'left' }}> {/* Col for the back button, align left */}
                    <button onClick={handleGoBack} className="button-back-icon-only" aria-label="Go back">
                         <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                         </svg>
                     </button>
                </Col>
                <Col xs={20} sm={21} md={22} style={{ textAlign: 'center' }}> {/* Col for the title, align center */}
                    <h1 className="checkout-title" style={{ margin: 0 }}> {/* Remove default h1 margin here */}
                        Checkout Your Cart ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                    </h1>
                </Col>
            </Row>

            <hr className="checkout-hr" /> {/* hr might need top margin now */}

            <div className="card checkout-card">
                {cartItems.length === 0 ? (
                    <p className="empty-cart-message">Your cart is empty.</p>
                ) : (
                    <div className="cart-items-list">
                        {cartItems.map(item => (
                            <CartItem
                                key={item.id || item._id}
                                item={item}
                                onUpdateQuantity={updateQuantity}
                                onRemoveItem={removeFromCart}
                            />
                        ))}
                    </div>
                )}

                {cartItems.length > 0 && (
                    <div className="order-summary-section">
                        <div className="order-total">
                            <span className="order-total-label">Total Price:</span>
                            <span className="order-total-value">${total.toFixed(2)}</span>
                        </div>
                        <Button
                            onClick={handleConfirmTransaction}
                            disabled={cartItems.length === 0}
                            type="primary"
                            className="button-confirm"
                        >
                            Confirm Transaction & Pay
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CheckoutPage;