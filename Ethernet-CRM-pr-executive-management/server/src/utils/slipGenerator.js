/**
 * Generate slip number with format: PREFIX-MONTH-YEAR-RANDOM
 * Example: GRN-SEP-2025-34
 */
export const generateSlipNumber = (prefix) => {
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 100);
  return `${prefix}-${month}-${year}-${random}`;
};

export const generateGRN = () => {
  return generateSlipNumber('GRN');
};

export const generateST = () => {
  return generateSlipNumber('ST');
};

export const generateMR = () => {
  return generateSlipNumber('MR');
};













