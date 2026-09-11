/**
 * Wraps styles/app.css's .form-group pattern: label + input + optional
 * .error-text, with the .required asterisk the PHP app's letter-create
 * form used on mandatory fields. TextareaField/SelectField (siblings
 * in this folder) follow the identical prop shape so a form can mix
 * all three without the field components looking inconsistent.
 */
import type { InputHTMLAttributes } from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function TextField({ label, error, required, id, ...rest }: TextFieldProps) {
  const fieldId = id ?? rest.name;
  return (
    <div className="form-group">
      <label htmlFor={fieldId}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input id={fieldId} required={required} {...rest} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
