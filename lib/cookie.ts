/**
 * Utility functions for parsing and extracting cookies
 */

/**
 * Extract connect.sid cookie value from a full cookie string
 * Handles cases where user pastes the entire Cookie header
 */
export function extractSidCookie(cookieString: string): string {
  if (!cookieString) return ''
  
  // Remove whitespace
  let cleaned = cookieString.trim()
  
  // If it already looks like just the value (no connect.sid=), return it
  if (!cleaned.includes('connect.sid') && !cleaned.includes('=')) {
    return cleaned
  }
  
  // First, try regex to find connect.sid (most reliable)
  const sidMatch = cleaned.match(/connect\.sid\s*=\s*([^;]+)/i)
  if (sidMatch && sidMatch[1]) {
    let value = sidMatch[1].trim()
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    // Verify it looks like a connect.sid value (starts with s%3A or s:)
    if (value.startsWith('s%3A') || value.startsWith('s:')) {
      return value
    }
  }
  
  // Split by semicolon to handle multiple cookies
  const cookies = cleaned.split(';')
  
  // Find the connect.sid cookie
  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    
    // Check if this is the connect.sid cookie
    if (trimmed.toLowerCase().startsWith('connect.sid=')) {
      // Extract the value after 'connect.sid='
      let value = trimmed.substring('connect.sid='.length).trim()
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      
      // Verify it looks like a connect.sid value
      if (value.startsWith('s%3A') || value.startsWith('s:')) {
        return value
      }
    }
  }
  
  // If it's just a single value that looks like connect.sid, return it
  if ((cleaned.includes('s%3A') || cleaned.startsWith('s:')) && !cleaned.includes('=')) {
    return cleaned
  }
  
  // If still nothing, return the original (might be just the value)
  return cleaned
}

/**
 * Validate if a string looks like a valid connect.sid cookie value
 */
export function isValidSidCookie(cookieValue: string): boolean {
  if (!cookieValue || cookieValue.length < 10) return false
  
  // connect.sid values typically start with 's%3A' (URL encoded 's:') or 's:'
  return cookieValue.startsWith('s%3A') || 
         cookieValue.startsWith('s:') || 
         cookieValue.includes('%') // URL encoded
}

