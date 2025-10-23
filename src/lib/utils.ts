import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format dataset cell values for display
 * Handles escaped JSON strings like "\"150000\"" -> "150000"
 */
export function formatDatasetValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // If it's a string that looks like JSON (starts and ends with quotes), try to parse it
  if (typeof value === 'string') {
    if (value.startsWith('"') && value.endsWith('"')) {
      try {
        const parsed = JSON.parse(value);
        return String(parsed);
      } catch (e) {
        // If parsing fails, return as-is
        return value;
      }
    }
    return value;
  }

  return String(value);
}
