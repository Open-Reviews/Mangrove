import React from 'react';

const RatingStars = ({ value }) => {
  const valueNorm = Math.max(0, Math.min(100, value));

  return (
    <div className="or-rating-stars">
      <span className="or-rating-stars-value" style={{ width: `${valueNorm}%` }} />
    </div>
  );
};

export default RatingStars;
