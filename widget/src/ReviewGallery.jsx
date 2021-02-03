import React, { useState } from 'react';

import './css/ReviewGallery.css';

const ReviewGallery = ({ images, index = 0, setGallery }) => {
  const [current, setCurrent] = useState(index);

  if (!Array.isArray(images) || images.length < index + 1) return null;

  const imgSrc = images[current].src;

  const onClose = () => {
    setGallery([], 0);
  };

  return (
    <div
      className="or-review-gallery-wrapper"
      onClick={(ev) => {
        ev.stopPropagation();
        if (ev.target.className === 'or-review-gallery-wrapper') onClose();
      }}>
      <div className="or-review-gallery-content">
        <div className="or-review-gallery-image-wrapper">
          <img src={imgSrc} className="or-review-gallery-image-wrapper" />
        </div>

        {images.length > 1 && (
          <div className="or-review-gallery-nav">
            <button
              className="or-review-gallery-nav-prev"
              onClick={() => {
                setCurrent(current - 1);
              }}
              disabled={current === 0}>
              <span className="or-review-gallery-nav-prev-content"></span>
            </button>

            <button
              className="or-review-gallery-nav-next"
              onClick={() => {
                setCurrent(current + 1);
              }}
              disabled={current === images.length - 1}>
              <span className="or-review-gallery-nav-next-content"></span>
            </button>
          </div>
        )}

        <button className="or-review-gallery-close" onClick={onClose}>
          <span className="or-review-gallery-close-content"></span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ReviewGallery);
