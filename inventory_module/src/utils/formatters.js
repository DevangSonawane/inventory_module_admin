export const formatDate = (date) => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

export const generateSlipNumber = (prefix) => {
  const date = new Date()
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()
  const year = date.getFullYear()
  const random = Math.floor(Math.random() * 100)
  return `${prefix}-${month}-${year}-${random}`
}

export const generateGRN = () => {
  return generateSlipNumber('GRN')
}

export const generateST = () => {
  return generateSlipNumber('ST')
}

export const generateMR = () => {
  return generateSlipNumber('MR')
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}



