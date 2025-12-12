import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', multiline, ...props }, ref) => {
  const baseClasses = `px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : ''} ${className}`
  const inputClasses = multiline 
    ? `${baseClasses} min-h-[100px] resize-y` 
    : `${baseClasses} h-[38px]`

  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          ref={ref}
          className={inputClasses}
          {...props}
        />
      ) : (
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
      )}
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

