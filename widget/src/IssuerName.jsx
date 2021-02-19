import React from 'react'

const IssuerName = ({ metadata = {} }) => {
  const { given_name: giveName, family_name: familyName, nickname } = metadata
  let name = []
  if (giveName) name.push(giveName)
  if (familyName) name.push(familyName)
  if (nickname) {
    if (name.length > 0) name.push(`(${nickname})`)
    else name.push(nickname)
  }
  if (name.length === 0 || name.join('') === '') return <div className="or-review-issuer-name">Anonymous</div>

  return <div className="or-review-issuer-name">{name.join(' ')}</div>
}

export default IssuerName
