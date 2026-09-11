/**
 * Wraps styles/app.css's .btn family (.btn-primary/.btn-secondary/
 * .btn-success/.btn-danger/.btn-warning/.btn-ghost, plus the .btn-sm /
 * .btn-block size modifiers) so call sites pick a variant by name
 * instead of remembering the exact class string.
 */
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'default' | 'sm';
  block?: boolean;
  /** Shows a spinner + disables the button - mirrors the PHP app's
   *  handleAjaxForm(), which swapped a submit button's contents for a
   *  spinner icon and disabled it while a request was in flight. */
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'default',
  block = false,
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || isLoading} {...rest}>
      {isLoading ? (
        <>
          <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Processing…
        </>
      ) : (
        children
      )}
    </button>
  );
}
