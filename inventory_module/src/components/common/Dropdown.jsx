import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Dropdown = forwardRef(({ label, error, options, showRefresh, showAdd, onRefresh, onAdd, className = '', ...props }, ref) => {
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
          className={`px-3 py-2 h-[38px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
            showAdd || showRefresh ? 'pr-14' : 'pr-8'
          } ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(showAdd || showRefresh) && (
          <div className="absolute right-7 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 z-10">
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
        <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  )
})

Dropdown.displayName = 'Dropdown'

export default Dropdown

