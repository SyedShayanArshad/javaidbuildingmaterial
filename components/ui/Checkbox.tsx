import React, { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            className={`
              w-4 h-4 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-800 
              border-slate-300 dark:border-slate-600 rounded 
              focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-0
              cursor-pointer transition-colors
              ${error ? 'border-red-500 dark:border-red-600' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label htmlFor={props.id} className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              {label}
            </label>
            {error && <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
