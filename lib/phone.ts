/**
 * Phone number formatting utilities
 * Converts phone numbers to E.164 format required by pythontextnow
 */

/**
 * Format phone number to E.164 format
 * E.164 format: +[country code][number]
 * Example: +12122037678 (US number)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.trim().replace(/[^\d+]/g, '')
  
  // If it already starts with +, validate it
  if (cleaned.startsWith('+')) {
    // Remove the + to check the number
    const numberPart = cleaned.slice(1)
    
    // If it's already in E.164 format (has country code), return as is
    if (numberPart.length >= 10 && numberPart.length <= 15) {
      return cleaned
    }
  }
  
  // Remove any existing + for processing
  cleaned = cleaned.replace(/^\+/, '')
  
  // If it's a 10-digit number, assume it's a US number and add country code 1
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}`
  }
  
  // If it's 11 digits and starts with 1, it's already a US number with country code
  if (cleaned.length === 11 && cleaned.startsWith('1') && /^\d{11}$/.test(cleaned)) {
    return `+${cleaned}`
  }
  
  // If it's already in a valid format (10-15 digits), add +
  if (cleaned.length >= 10 && cleaned.length <= 15 && /^\d+$/.test(cleaned)) {
    return `+${cleaned}`
  }
  
  // If we can't format it, return with + prefix anyway and let the API validate
  return cleaned ? `+${cleaned}` : cleaned
}

/**
 * Validate if a phone number is in valid E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phoneNumber)
}

/**
 * Format and validate phone number
 * Returns formatted number or throws error if invalid
 */
export function formatAndValidatePhoneNumber(phoneNumber: string): string {
  const formatted = formatPhoneNumber(phoneNumber)
  
  if (!isValidE164(formatted)) {
    throw new Error(`Invalid phone number format. Please use E.164 format (e.g., +12122037678 for US numbers)`)
  }
  
  return formatted
}

