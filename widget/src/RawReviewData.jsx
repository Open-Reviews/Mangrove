import React from 'react';
import { useGlobalState } from './GlobalState';


const RawReviewData = () => {
  const {
    state: {
      reviews,
      rawReviewData: { signature: rawReviewDataSignature }
    },
    actions: { setRawReviewDataSignature }
  } = useGlobalState();

  const review = reviews.filter(r => r.signature === rawReviewDataSignature)[0];

  return (
    <div className="or-review-form-wrapper">
      <div className="or-review-form-content">
        <div className="or-review-form-title-wrapper">
          <div className="or-review-form-title">Raw Mangrove Review</div>
        </div>
        <div className="or-review-form-close">
          <button className="or-review-form-close-button" onClick={() => setRawReviewDataSignature('')}>
            <span />
          </button>
        </div>
        <h3>JWT</h3>
        <div className="or-review-raw-data-jwt">
          {review.jwt}
        </div>
        <h3>Review Data</h3>
        <div className="or-review-raw-data-json">
          <pre>{JSON.stringify(review, null, 4)}</pre>
        </div>
      </div>
    </div>
  );
};

export default RawReviewData;
