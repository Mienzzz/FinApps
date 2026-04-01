/**
 * Formats a numeric string with thousand separators.
 * @param value The raw numeric string or number.
 * @param locale The locale to use for formatting.
 * @returns A formatted string with separators.
 */
export const formatNumberInput = (value: string | number, locale: string = 'id-ID'): string => {
  if (value === '' || value === undefined || value === null) return '';
  
  // Remove existing non-digit characters except for potential decimal point
  const cleanValue = value.toString().replace(/[^\d]/g, '');
  
  if (cleanValue === '') return '';
  
  const number = parseInt(cleanValue, 10);
  
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Parses a formatted string back to a raw numeric string.
 * @param value The formatted string with separators.
 * @returns A raw numeric string.
 */
export const parseNumberInput = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};
