import React, { type InputHTMLAttributes, useState } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  type = 'text',
  className = '',
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  
  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-field-group ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon left">{leftIcon}</span>}
        
        <input
          ref={ref}
          type={resolvedType}
          disabled={disabled}
          className={`input-control ${leftIcon ? 'has-left-icon' : ''} ${isPassword || rightIcon ? 'has-right-icon' : ''}`}
          {...props}
        />
        
        {isPassword ? (
          <button
            type="button"
            className="input-icon right password-toggle-btn"
            onClick={handlePasswordToggle}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        ) : (
          rightIcon && <span className="input-icon right">{rightIcon}</span>
        )}
      </div>
      
      {error && <p className="input-error-msg">{error}</p>}
      {!error && helperText && <p className="input-helper-msg">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
