/**
 * Generate DiceBear Micah avatar URL
 * @param seed - Unique identifier (email, user ID, name, etc.)
 * @returns URL to DiceBear Micah avatar SVG
 */
export function getDiceBearAvatar(seed: string): string {
  if (!seed || seed.trim() === '') {
    seed = 'default'
  }
  return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
}

/**
 * Get user initials for avatar fallback
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param email - User's email (used as fallback)
 * @returns Initials string (e.g., "JD" for John Doe)
 */
export function getUserInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (firstName) {
    return firstName[0].toUpperCase()
  }
  if (lastName) {
    return lastName[0].toUpperCase()
  }
  if (email) {
    return email[0].toUpperCase()
  }
  return '?'
}

/**
 * Get user full name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param email - User's email (used as fallback)
 * @returns Full name string
 */
export function getUserName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }
  if (firstName) {
    return firstName
  }
  if (lastName) {
    return lastName
  }
  if (email) {
    return email
  }
  return 'Unknown'
}

