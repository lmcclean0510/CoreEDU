export {};

declare global {
  interface Window {
    firestoreMonitor?: {
      logRead?: (message: string) => void;
      logWrite?: (message: string) => void;
    };
  }
}
