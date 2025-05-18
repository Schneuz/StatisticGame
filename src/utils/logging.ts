/**
 * Centralized logging function that is disabled in production
 * 
 * @param message - The logging message
 * @param data - Optional data for logging
 */
export const log = process.env.NODE_ENV === 'production' 
  ? () => {} 
  : (message: string, ...data: any[]) => console.log(message, ...data);

/**
 * Logging function for warnings, active even in production
 */
export const warn = (message: string, ...data: any[]) => console.warn(message, ...data);

/**
 * Logging function for errors, active even in production
 */
export const error = (message: string, ...data: any[]) => console.error(message, ...data); 