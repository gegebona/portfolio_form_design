import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names and lets later Tailwind classes win over earlier ones (e.g. a className prop over defaults). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
