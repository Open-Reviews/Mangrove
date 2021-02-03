import React from 'react';
import PropTypes from 'prop-types';

import { stringToColor } from './utils';

const IssuerIcon = ({ kid, metadata }) => {
  const avatarBgColor = stringToColor(kid);
  const { given_name: giveName = '', family_name: familyName = '', nickname = '' } = metadata;

  const chars = [];
  if (giveName.length > 0) chars.push(giveName[0]);
  if (familyName.length > 0) chars.push(familyName[0]);
  if (nickname.length > 0) chars.push(nickname[0]);

  if (chars.length === 0) chars = ['ORA'];

  return (
    <div className="or-review-avatar" style={{ backgroundColor: avatarBgColor }}>
      {chars.join('').toLocaleUpperCase()}
    </div>
  );
};

IssuerIcon.propTypes = {
  kid: PropTypes.string.isRequired,
  metadata: PropTypes.shape({
    given_name: PropTypes.string,
    family_name: PropTypes.string,
    nickname: PropTypes.string,
  }).isRequired,
};
export default IssuerIcon;
