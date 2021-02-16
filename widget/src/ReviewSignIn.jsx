import React, { useState } from 'react';
import { useGlobalState } from './GlobalState';
import { useI18n } from './i18n';
import IssuerName from './IssuerName';
import IssuerIcon from './IssuerIcon';

const ReviewSignIn = ({ metadata }) => {
  const {
    state: {
      issuer: {
        JWK: privateKey = '',
        PEM: publicKey = '',
        info: { count },
      },
    },
    actions: { onLogIn },
  } = useGlobalState();

  const { t } = useI18n();

  const [passwd, setPasswd] = useState('');
  const [signInVisible, setSignInVisible] = useState(false);

  const onJWKChange = (event) => {
    setPasswd(event.target.value);
  };
  const onJWKUpdate = async () => {
    await onLogIn(passwd);
  };

  const ifEnter = (func) => (e) => {
    if (e.which === 13) func(e);
  };

  if (!privateKey) return null;

  return (
    <div className="or-signin-wrapper">
      <div className="or-signin-account-info">
        <div className="or-signin-account-aside">
          <IssuerIcon kid={publicKey} metadata={metadata} />
          <IssuerName metadata={metadata} />
        </div>
        <div className="or-signin-account-main">
          {count === 0 ? (
            <>
              <p>{t('signInNew')} </p>
              <p>
                {t('signInReturning')}{' '}
                <button onClick={() => setSignInVisible(true)} className="or-signin-button">
                  {t('signInLogIn')}
                </button>
              </p>
            </>
          ) : (
            <p>
              {t('signInReturning')}{' '}
              <button onClick={() => setSignInVisible(true)} className="or-signin-button">
                {t('signInLogIn')}
              </button>
            </p>
          )}
        </div>
      </div>
      {signInVisible && (
        <div className="or-signin-account-keys" onClick={() => setSignInVisible(false)}>
          <div className="or-signin-account-content" onClick={(e) => e.stopPropagation()}>
            <p className="or-signin-account-input-container">
              <input
                type="password"
                value={passwd}
                className="or-signin-account-input"
                onChange={onJWKChange}
                onKeyDown={ifEnter(onJWKUpdate)}
                placeholder={t('signInPlaceholder')}
                required
              />
              <button
                className="or-base-button"
                onClick={async (event) => {
                  event.preventDefault();
                  await onJWKUpdate();
                  setSignInVisible(false);
                }}>
                {t('logIn')}
              </button>
            </p>
            {
              //does not necessarry needs to be visible
            }
            {/* <p>
            {t('currentPem')} <input type="text" value={publicKey} readOnly />
          </p> */}
          </div>
        </div>
      )}

      {/*
      <div className="or-signin-title">Dev info:</div>
      <div className="or-signin-sign">
        <div>
          Issuer info:
          <pre>{JSON.stringify(issuerInfo, null, 2)}</pre>
        </div>
        <div>
          Issuer Metadata:
          <pre>{JSON.stringify(issuerMetadata, null, 2)}</pre>
        </div>
      </div>
       */}
    </div>
  );
};

export default ReviewSignIn;
