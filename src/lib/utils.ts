import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export avatar utilities
export {
  getDiceBearAvatar,
  getUserInitials,
  getUserName,
} from './utils/avatar'
