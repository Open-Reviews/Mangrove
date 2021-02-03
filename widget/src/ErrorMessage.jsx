import React from 'react';

import { useGlobalState } from './GlobalState';
import { useI18n } from './i18n';

const ErrorMessage = () => {
  const {
    state: { errorMessage = '' },
    actions: { setErrorMessage },
  } = useGlobalState();
  const { t } = useI18n();

  if (!errorMessage) return null;

  return (
    <div className="or-review-global-error-wrapper" onClick={() => setErrorMessage('')}>
      <div className="or-review-global-error">
        <h3>{t('errorInfo')}</h3>
        <p>{errorMessage}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
