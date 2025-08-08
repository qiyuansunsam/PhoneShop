import React from 'react';
import { Rate } from 'antd';

const StarRating = ({ rating, className, size = "default", disabled = true, allowHalf = true, character }) => {

  const antdSize = size === "small" ? 14 : size === "large" ? 24 : 20; 

  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    return null; 
  }

  return (
    <span className={`star-rating ${className || ''}`} aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}>
      <Rate value={rating} allowHalf={allowHalf} disabled={disabled} style={{ fontSize: antdSize, lineHeight: 1 }} character={character} />
    </span>
  );
};

export default StarRating;