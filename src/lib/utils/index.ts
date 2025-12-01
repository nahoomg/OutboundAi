import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { extractLatestMessage, formatEmailBody } from './emailParser';
export { generateICS, createICSBuffer, type MeetingDetails } from './ics';
export { runWithRetry } from './rate-limiter';
