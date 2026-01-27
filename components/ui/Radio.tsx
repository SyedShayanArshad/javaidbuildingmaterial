import React, { InputHTMLAttributes } from 'react';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="radio"
          className={`
            w-4 h-4 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-800
            border-slate-300 dark:border-slate-600
            focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-0
            cursor-pointer transition-colors
            ${className}
          `}
          {...props}
        />
        <label htmlFor={props.id} className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          {label}
        </label>
      </div>
    );
  }
);

Radio.displayName = 'Radio';
