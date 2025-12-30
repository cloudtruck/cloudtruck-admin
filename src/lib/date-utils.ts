import { format, isValid, formatDistanceToNow as fdn } from 'date-fns';

/**
 * Safely formats a date string or object.
 * Returns a fallback string if the date is invalid.
 */
export const formatDate = (
  date: string | number | Date | null | undefined,
  formatStr: string = 'dd MMM yyyy, hh:mm a',
  fallback: string = 'N/A'
): string => {
  if (!date) return fallback;
  
  const d = new Date(date);
  if (!isValid(d)) return fallback;
  
  return format(d, formatStr);
};

/**
 * Safely formats distance to now.
 */
export const formatDistanceToNow = (
  date: string | number | Date | null | undefined,
  options?: { addSuffix?: boolean },
  fallback: string = 'N/A'
): string => {
  if (!date) return fallback;
  
  const d = new Date(date);
  if (!isValid(d)) return fallback;
  
  return fdn(d, options);
};
