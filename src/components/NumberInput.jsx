import React from 'react';
import InlineHelp from './InlineHelp';

const INPUT_CLASS =
  'w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none';

export default function NumberInput({
  label,
  field,
  value,
  onChange,
  activeField,
  onFocus,
  onBlur,
  min,
  max,
  step,
  readOnly = false,
  className: extraClass = '',
}) {
  const isActive = activeField === field;

  return (
    <div className={`relative ${isActive ? 'z-40' : 'z-10'}`}>
      <label
        htmlFor={`input-${field}`}
        className="block text-sm font-medium text-slate-600 mb-1"
      >
        {label}
      </label>
      <input
        id={`input-${field}`}
        type="number"
        value={value}
        onChange={onChange}
        onFocus={() => onFocus(field)}
        onBlur={onBlur}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        aria-describedby={`help-${field}`}
        className={`${INPUT_CLASS} ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed focus:ring-0 focus:border-slate-200' : ''} ${extraClass}`}
      />
      <InlineHelp field={field} isActive={isActive} />
    </div>
  );
}
