/**
 * Validation utilities for the application
 */

/**
 * Validates a Benin phone number format
 * @param phone - The phone number to validate (with or without +229 prefix)
 * @returns Object with isValid flag and formatted phone number
 */
export function validateBeninPhone(phone: string): {
  isValid: boolean
  formatted: string
  error?: string
} {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Check if it starts with 229 (country code)
  let phoneNumber = cleaned
  if (cleaned.startsWith('229') && cleaned.length > 3) {
    phoneNumber = cleaned.slice(3)
  }

  // Validate length (should be 8 digits after country code)
  if (phoneNumber.length !== 8) {
    return {
      isValid: false,
      formatted: '',
      error: 'Le numéro doit comporter 8 chiffres'
    }
  }

  // Validate prefix (valid Benin prefixes)
  const validPrefixes = ['01', '02', '04', '05', '06', '07', '09', '97', '98']
  const prefix = phoneNumber.slice(0, 2)
  
  if (!validPrefixes.includes(prefix)) {
    return {
      isValid: false,
      formatted: '',
      error: 'Format invalide. Préfixes acceptés: 01, 02, 04, 05, 06, 07, 09, 97, 98'
    }
  }

  // Format with country code
  const formatted = `+229${phoneNumber}`

  return {
    isValid: true,
    formatted
  }
}

/**
 * Formats a phone number for display
 * @param phone - The phone number to format (should include +229)
 * @returns Formatted phone number (e.g., +229 97 00 00 00)
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('229') && cleaned.length === 11) {
    const prefix = cleaned.slice(0, 3)
    const part1 = cleaned.slice(3, 5)
    const part2 = cleaned.slice(5, 7)
    const part3 = cleaned.slice(7, 9)
    const part4 = cleaned.slice(9, 11)
    return `${prefix} ${part1} ${part2} ${part3} ${part4}`
  }
  
  return phone
}
