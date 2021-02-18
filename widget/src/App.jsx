import { hot } from 'react-hot-loader';
import React from 'react';

import I18n from './i18n';
import GlobalState from './GlobalState';
import Layout from './Layout';

import i18nConfig from './utils/locales';

const App = ({ config = {} }) => {
  const { getPrefferedLang } = i18nConfig;
  const [locale, lngDict] = getPrefferedLang();

  // commit to trigger widget deploy
  return (
    <I18n lngDict={lngDict} locale={locale}>
      <GlobalState config={config}>
        <Layout />
      </GlobalState>
    </I18n>
  );
};

export default hot(module)(App);
