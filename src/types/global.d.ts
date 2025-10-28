export {};

declare global {
  interface Window {
    firestoreMonitor?: {
      logRead?: (message: string) => void;
      logWrite?: (message: string) => void;
    };
  }
}

declare module 'react-day-picker';
declare module 'recharts';
declare module 'react-hook-form';
declare module '@radix-ui/react-menubar';
declare module '@radix-ui/react-radio-group';
declare module '@radix-ui/react-slider';
