import React from 'react';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  name?: string;
  id?: string;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  required = false,
  error,
  label = 'Miktar',
  name = 'quantity',
  id = 'quantity-input'
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      // Ensure the value is within bounds
      const boundedValue = Math.max(min, max ? Math.min(max, newValue) : newValue);
      onChange(boundedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // If empty or invalid, set to minimum value
    if (!e.target.value || isNaN(parseInt(e.target.value, 10))) {
      onChange(min);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`mt-1 relative rounded-md shadow-sm ${error ? 'ring-2 ring-red-500' : ''}`}>
        <input
          type="number"
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            block w-full rounded-md border-gray-300
            focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${isFocused ? 'border-blue-500 ring-blue-500' : 'hover:border-gray-400'}
            ${error ? 'border-red-500' : ''}
            transition-colors duration-200
          `}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};