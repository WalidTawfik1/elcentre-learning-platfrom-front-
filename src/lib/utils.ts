import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // For single words, take first two characters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // For multiple words, take first letter of first two words
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
}
