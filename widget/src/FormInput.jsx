import React from 'react'

const FormInput = ({ id, label, value, onChange, type = 'text', rules = {} }) => {
  const { maxlength, required = false } = rules

  return (
    <>
      <div className="or-form-text-field">
        <div className="or-form-input-wrapper">
          {label && (
            <label className="or-review-form-label" htmlFor={id}>
              {label}:
            </label>
          )}

          {type === 'text' && (
            <input id={id} type="text" value={value} onChange={onChange} maxLength={maxlength} />
          )}
          {type === 'number' && (
            <input id={id} type="number" value={value} onChange={onChange} maxLength={maxlength} onInput={(e) => {
              if (e.target.value.length > 3) {
                e.target.value = e.target.value.slice(0, 3)
              }
            }} />
          )}
          {type === 'textarea' && (
            <textarea id={id} type="text" value={value} onChange={onChange} maxLength={maxlength} />
          )}
        </div>

        <div className="or-form-text-field-footer">
          <div className="or-form-notes-wrapper">
            <div className="or-form-notes"></div>
          </div>
          {maxlength > 0 && (
            <div className="or-form-counter">
              {value.toString().length}/{maxlength}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default FormInput
