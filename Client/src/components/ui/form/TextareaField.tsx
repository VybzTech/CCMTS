import type { TextareaHTMLAttributes } from 'react';

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function TextareaField({ label, error, required, id, ...rest }: TextareaFieldProps) {
  const fieldId = id ?? rest.name;
  return (
    <div className="form-group">
      <label htmlFor={fieldId}>
        {label} {required && <span className="required">*</span>}
      </label>
      <textarea id={fieldId} required={required} {...rest} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
