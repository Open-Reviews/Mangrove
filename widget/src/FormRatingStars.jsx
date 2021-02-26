import React, { useState } from 'react';
import RatingStars from './RatingStars';

import './css/FormRatingStars.css';

const FormRatingStars = ({ label, value, onChange }) => {
  const [hoverValue, setHoverValue] = useState(0);
  const rating = hoverValue > 0 ? hoverValue * 20 : value * 20;

  return (
    <>
      {label && (
        <label className="or-review-form-label" htmlFor="or-review-form-rating">
          {label}
        </label>
      )}

      <div className="or-review-form-rating-stars-wrapper">
        <RatingStars value={rating} showAtZero={true} />

        <div className="or-review-form-rating-stars-buttons">
          {[...Array(6).keys()].map((ratingValue) => {
            const id = `or-review-form-rating-${ratingValue}`;
            return (
              <button
                key={id}
                id={id}
                name="or-review-form-rating"
                type="radio"
                value={ratingValue}
                checked={parseInt(value) === ratingValue}
                onClick={onChange}
                onMouseEnter={() => setHoverValue(ratingValue)}
                onMouseLeave={() => setHoverValue(0)}>
                {ratingValue}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default FormRatingStars;
