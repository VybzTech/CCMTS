import type { SelectHTMLAttributes } from 'react';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function SelectField({ label, error, required, id, children, ...rest }: SelectFieldProps) {
  const fieldId = id ?? rest.name;
  return (
    <div className="form-group">
      <label htmlFor={fieldId}>
        {label} {required && <span className="required">*</span>}
      </label>
      <select id={fieldId} required={required} {...rest}>
        {children}
      </select>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
