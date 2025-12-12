import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Dropdown = forwardRef(({ label, error, options, showRefresh, showAdd, onRefresh, onAdd, className = '', ...props }, ref) => {
  // Calculate padding and icon position based on which buttons are shown
  const hasButtons = showAdd || showRefresh
  const hasBothButtons = showAdd && showRefresh
  
  // Dynamic padding: more space when both buttons are shown
  const paddingRight = hasBothButtons ? 'pr-20' : hasButtons ? 'pr-14' : 'pr-8'
  
  // ChevronDown position: further left when buttons are present
  const chevronRight = hasBothButtons ? 'right-14' : hasButtons ? 'right-10' : 'right-2.5'
  
  // Buttons container position
  const buttonsRight = hasBothButtons ? 'right-9' : 'right-7'
  
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`px-3 py-2 h-[38px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${paddingRight} ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(showAdd || showRefresh) && (
          <div className={`absolute ${buttonsRight} top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 z-10`}>
            {showAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold leading-none p-0 m-0 pointer-events-auto"
                title="Add New"
              >
                +
              </button>
            )}
            {showRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="text-gray-500 hover:text-gray-700 text-sm leading-none p-0 m-0 pointer-events-auto"
                title="Refresh"
              >
                ↻
              </button>
            )}
          </div>
        )}
        <ChevronDown className={`absolute ${chevronRight} top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none`} />
      </div>
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  )
})

Dropdown.displayName = 'Dropdown'

export default Dropdown

