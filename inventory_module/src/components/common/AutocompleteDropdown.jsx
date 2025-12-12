import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

const AutocompleteDropdown = ({ 
  label, 
  error, 
  options = [], 
  value, 
  onChange, 
  onInputChange,
  placeholder = 'Type or select...',
  required = false,
  disabled = false,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const wrapperRef = useRef(null)

  // Update input value when value prop changes
  useEffect(() => {
    if (value) {
      const selectedOption = options.find(opt => opt.value === value)
      if (selectedOption) {
        setInputValue(selectedOption.label)
      } else {
        setInputValue(value)
      }
    } else {
      setInputValue('')
    }
  }, [value, options])

  // Filter options based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredOptions(options)
    } else {
      const filtered = options.filter(opt => 
        opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        opt.value.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [inputValue, options])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    if (onInputChange) {
      onInputChange(newValue)
    }
  }

  const handleSelect = (option) => {
    setInputValue(option.label)
    onChange(option.value)
    setIsOpen(false)
  }

  const handleClear = () => {
    setInputValue('')
    onChange('')
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col" ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 h-[38px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20 ${
              error ? 'border-red-500' : ''
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {inputValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-500 ${isOpen ? 'transform rotate-180' : ''} transition-transform`} />
          </div>
        </div>
        
        {isOpen && !disabled && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                  value === option.value ? 'bg-blue-100' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  )
}

export default AutocompleteDropdown

