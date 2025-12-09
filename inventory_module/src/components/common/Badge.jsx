const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    requested: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    request: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export default Badge

