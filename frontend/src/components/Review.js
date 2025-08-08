import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import StarRating from './StarRating';
import '../styles/ItemDetailModal.css';
import { message } from 'antd';

const Review = ({ review, canToggle, onToggleVisibility }) => {
    const isActuallyHidden = String(review.hidden).toLowerCase() === 'true';
    return (
        <div className={`review-item ${isActuallyHidden ? 'review-item--hidden' : ''}`}>
            <div className="review-item__header">
                <div 
                    className="review-item__info" 
                    style={{ minWidth: 0 }} 
                >
                    <h4 
                        className="review-item__name" 
                        style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                        }}
                        title={review.title || review.reviewerFullName || review.reviewer ||  'Anonymous'} 
                    >{review.title || review.reviewerFullName || review.reviewer || 'Anonymous'}</h4>
                    <span className="review-item__rating">
                        <StarRating rating={review.rating} /> ({review.rating !== undefined && review.rating !== null ? Number(review.rating).toFixed(1) : 'N/A'})
                    </span>
                </div>
                {canToggle && (
                    <button
                        onClick={() => onToggleVisibility(review)}
                        className="button-link review-item__toggle"
                        title={isActuallyHidden ? "Make review visible" : "Hide review"}
                    >
                        {isActuallyHidden ? 'Show' : 'Hide'}
                    </button>
                )}
            </div>
            <p className="review-item__comment">{review.comment}</p>
        </div>
    );
};

export default Review;