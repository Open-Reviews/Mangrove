import React, { useEffect } from 'react';

import { useGlobalState } from './GlobalState';
import { useI18n } from './i18n';

const StatusMessage = () => {
  const {
    state: {
      statusMessage: { type, message },
    },
    actions: { setStatusMessage },
  } = useGlobalState();
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatusMessage({ type: '', message: '' });
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [type]);

  if (!type) return null;

  return (
    <div
      className={
        type === 'success'
          ? 'or-review-global-status or-review-global-success'
          : 'or-review-global-status or-review-global-error'
      }>
      <p>{message}</p>
    </div>
  );
};

export default StatusMessage;
