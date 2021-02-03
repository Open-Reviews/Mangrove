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
      config: { sub },
    },
    actions: { setReviewFormSub },
  } = useGlobalState();
  const { t } = useI18n();

  if (isEmptyObject(subject)) return null;

  const { quality = 0, opinion_count: opinionCount = 0 } = subject;
  const STARS_MAX = 5;
  const qualityStars = ((quality * STARS_MAX) / 100).toFixed(1);

  return (
    <div className="or-review-subject-wrapper">
      {opinionCount > 0 && (
        <div className="or-review-subject-rating">
          <RatingStars value={quality} />{' '}
          <span className="or-review-subject-rating-quality">{qualityStars}</span>{' '}
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
