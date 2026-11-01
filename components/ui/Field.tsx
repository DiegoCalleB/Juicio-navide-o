import { forwardRef, type InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const errId = error && id ? `${id}-err` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-court-snow/80">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
        className={`min-h-12 w-full rounded-2xl border bg-court-bg px-4 text-base text-court-snow placeholder:text-court-snow/30 focus:border-court-gold focus:outline-none ${error ? 'border-court-red' : 'border-court-line'} ${className}`}
        {...rest}
      />
      {error && (
        <p id={errId} role="alert" className="text-sm text-court-red">
          {error}
        </p>
      )}
    </div>
  );
});
