const Button = ({
  variant = 'primary',
  children,
  className = '',
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    gray: 'bg-gray-300 text-gray-700 hover:bg-gray-400',
  }

  const iconNode = icon ? <span className="flex items-center">{icon}</span> : null

  return (
    <button
      className={`${baseStyles} ${variants[variant] || ''} ${className}`}
      {...props}
    >
      {iconPosition === 'left' && iconNode}
      {children}
      {iconPosition === 'right' && iconNode}
    </button>
  )
}

export default Button



