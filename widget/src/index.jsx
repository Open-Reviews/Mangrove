/* eslint-disable no-console */
import React from 'react';
import { render } from 'react-dom';

import ErrorBoundary from './ErrorBoundary';
import App from './App';

import './widget-init';

export const init = (config = {}) => {
  const { selector = '#root' } = config;
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (el === null) throw 'Widget container not found, verify `selector` param.';

  render(
    <ErrorBoundary>
      <App config={config} />
    </ErrorBoundary>,
    el
  );
};

export default init;
