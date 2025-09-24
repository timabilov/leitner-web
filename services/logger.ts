type LogLevel = "INFO" | "ERROR" | "WARN";

interface Logger {
  note(noteId: number | string, message: string, ...args: unknown[]): void;
  error(noteId: number | string, message: string, ...args: unknown[]): void;
  warn(noteId: number | string, message: string, ...args: unknown[]): void;
}

export const noteLogger: Logger = {
  note(noteId: number | string, message: string, ...args: unknown[]): void {
    console.log(`[Note ${noteId}] ${message}`, ...args);
  },
  error(noteId: number | string, message: string, ...args: unknown[]): void {
    console.error(`[${new Date().toISOString()}] [Note ${noteId}] ERROR: ${message}`, ...args);
  },
  warn(noteId: number | string, message: string, ...args: unknown[]): void {
    console.warn(`[${new Date().toISOString()}] [Note ${noteId}] WARN: ${message}`, ...args);
  },
};