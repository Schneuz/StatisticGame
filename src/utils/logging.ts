/**
 * Zentralisierte Logging-Funktion, die in Produktion deaktiviert ist
 * 
 * @param message - Die Logging-Nachricht
 * @param data - Optionale Daten für das Logging
 */
export const log = process.env.NODE_ENV === 'production' 
  ? () => {} 
  : (message: string, ...data: any[]) => console.log(message, ...data);

/**
 * Logging-Funktion für Warnungen, auch in Produktion aktiv
 */
export const warn = (message: string, ...data: any[]) => console.warn(message, ...data);

/**
 * Logging-Funktion für Fehler, auch in Produktion aktiv
 */
export const error = (message: string, ...data: any[]) => console.error(message, ...data); 