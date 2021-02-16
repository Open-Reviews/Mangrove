import React from 'react'
import PropTypes from 'prop-types'

import { stringToColor } from './utils'

const IssuerIcon = ({ kid, metadata }) => {
  const avatarBgColor = stringToColor(kid, '100%', '40%')
  const avatarBgColor1 = stringToColor(kid, '100%', '35%')
  const avatarBgColor2 = stringToColor(kid, '100%', '30%')

  const { given_name: giveName = '', family_name: familyName = '', nickname = '' } = metadata

  const chars = [];

  [giveName, familyName, nickname].forEach((item) => {
    if (item.length > 0) chars.push(item[0])
  })

  return (
    <div
      className="or-review-avatar"
      style={{
        backgroundColor: avatarBgColor,
        borderColor: avatarBgColor2,
        borderTopColor: avatarBgColor1,
        borderRightColor: avatarBgColor1,
      }}>
      {!giveName && !familyName && !nickname ? '?' : chars.join('').toLocaleUpperCase()}
    </div>
  )
}

IssuerIcon.propTypes = {
  kid: PropTypes.string.isRequired,
  metadata: PropTypes.shape({
    given_name: PropTypes.string,
    family_name: PropTypes.string,
    nickname: PropTypes.string,
  }).isRequired,
}
export default IssuerIcon
