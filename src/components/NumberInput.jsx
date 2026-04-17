import InlineHelp from './InlineHelp';

const INPUT_CLASS =
  'w-full px-3.5 py-2 bg-white border border-accenture-gray-light text-black focus:ring-1 focus:ring-accenture-purple focus:border-accenture-purple transition-colors outline-none';

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
        className="block text-sm font-medium text-accenture-gray-dark mb-1.5"
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
        className={`${INPUT_CLASS} ${readOnly ? 'bg-accenture-gray-off-white text-accenture-gray-dark cursor-not-allowed focus:ring-1 focus:ring-accenture-gray-dark focus:border-accenture-gray-dark' : ''} ${extraClass}`}
      />
      <InlineHelp field={field} isActive={isActive} />
    </div>
  );
}
