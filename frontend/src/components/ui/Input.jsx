import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  type = 'text',
  error,
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={id}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border bg-white/50 focus:bg-white text-slate-800 transition-all duration-200 outline-none text-sm
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
            : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20'
          }`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
