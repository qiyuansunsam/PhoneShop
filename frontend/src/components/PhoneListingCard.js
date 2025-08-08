import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import {Image} from 'antd';
import '../styles/PhoneListingCard.css';

const calculateReviewStats = (reviews) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return { averageRating: null, uniqueReviewerCount: 0 };
  }

  // Filter out reviews that might be malformed or lack a numeric rating or reviewer ID
  const validReviews = reviews.filter(
    review => review && 
              typeof review.rating === 'number' && 
              !isNaN(parseFloat(review.rating)) && 
              isFinite(review.rating) &&
              review.reviewer != null 
  );

  if (validReviews.length === 0) {
    return { averageRating: null, uniqueReviewerCount: 0 };
  }

  const totalRating = validReviews.reduce((sum, review) => sum + Number(review.rating), 0);
  const average = totalRating / validReviews.length; // Average based on all valid review entries

  const reviewerIds = new Set(validReviews.map(review => review.reviewer));
  const uniqueReviewerCount = reviewerIds.size;

  return { averageRating: average, uniqueReviewerCount };
};


function PhoneListingCard({ phone, type = 'search' }) { 
  if (!phone) {
    return null;
  }
  const { averageRating, uniqueReviewerCount } = calculateReviewStats(phone.reviews);
  const title = phone.title || 'No Title';
  const price = typeof phone.price === 'number' ? phone.price.toFixed(2) : 'N/A';
  const stock = typeof phone.stock === 'number' ? phone.stock : 'N/A';
  return (
    <div className={`phone-card type-${type}`}>
        <div className="phone-card-image-container">
             <Image
                src={`http://localhost:3000/images/${phone.image}`}
                alt="Listing image"
                className="phone-card-image"
                fallback="http://localhost:3000/images/Apple.jepg"
                preview={false} // Add this line to disable image preview
            />
            {typeof stock === 'number' && stock === 0 && <div className="stock-overlay sold-out">Sold Out</div>}
            {typeof stock === 'number' && stock > 0 && <div className="stock-overlay low-stock">Stock ({stock} left)</div>}
        </div>

      <div className="phone-card-content">
        <h3 className="phone-card-title">{title}</h3>

        <div className="phone-card-rating">
          {averageRating !== null ? (
            <>
              <StarRating rating={averageRating} />
              <span className="rating-text"> ({averageRating.toFixed(1)})</span>
              <span className="review-count">
                ({uniqueReviewerCount} {uniqueReviewerCount === 1 ? 'review' : 'reviews'})
              </span>
            </>
          ) : <span className="rating-text">No reviews yet</span>}
        </div>

        <p className="phone-card-price">${price}</p>

      </div>
    </div>
  );
}

export default PhoneListingCard;