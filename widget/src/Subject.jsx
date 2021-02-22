import React from 'react';
import { isEmptyObject } from './utils';

import { useGlobalState } from './GlobalState';
import { useI18n } from './i18n';
import RatingStars from './RatingStars';

import './css/Subject.css';

const Subject = () => {
  const {
    state: {
      subject,
      config: { sub, ratingAlgorithm },
      reviews,
    },
    actions: { setReviewFormSub },
  } = useGlobalState();
  const { t } = useI18n();

  if (isEmptyObject(subject)) return null;

  let { quality = 0, opinion_count: opinionCount = 0 } = subject;
  if (ratingAlgorithm === 'local') {
    const reviewsWithRatings = reviews.filter(r => r.payload.rating)
    opinionCount = reviewsWithRatings.length;
    quality = reviewsWithRatings.map((r) => r.payload.rating).reduce((prev, next) => prev + next) / opinionCount;
  }
  const STARS_MAX = 5;
  const qualityStars = ((quality * STARS_MAX) / 100).toFixed(1);

  return (
    <div className="or-review-subject-wrapper">
      {opinionCount > 0 && (
        <div className="or-review-subject-rating">
          <RatingStars value={quality} />{' '}
          <span className="or-review-subject-rating-quality" title="Rating" >{qualityStars}</span>{' '}
          <span className="or-review-subject-rating-count">({opinionCount})</span>
        </div>
      )}
      <div className="or-review-subject-rate-button">
        <button onClick={() => setReviewFormSub(sub)} className="or-base-button">
          {t('rateAndReview')}
        </button>
      </div>
    </div>
  );
};

export default Subject;
