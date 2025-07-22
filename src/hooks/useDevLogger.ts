import { useEffect } from 'react';
import { logger } from '@/components/DevLogger';

export const useDevLogger = (component: string) => {
  const log = {
    info: (message: string, data?: any) => {
      logger.log('info', component, message, data);
    },
    warn: (message: string, data?: any) => {
      logger.log('warn', component, message, data);
    },
    error: (message: string, data?: any, error?: Error) => {
      logger.log('error', component, message, data, error);
    },
    debug: (message: string, data?: any) => {
      logger.log('debug', component, message, data);
    }
  };

  // Log component mount/unmount
  useEffect(() => {
    log.debug(`Component mounted: ${component}`);
    return () => {
      log.debug(`Component unmounted: ${component}`);
    };
  }, [component]);

  return log;
};

// Global error boundary logger
export const logGlobalError = (error: Error, errorInfo?: any) => {
  logger.log('error', 'GlobalErrorBoundary', error.message, {
    stack: error.stack,
    errorInfo
  }, error);
};

// Promise rejection logger
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logger.log('error', 'UnhandledPromise', 'Unhandled promise rejection', {
      reason: event.reason,
      promise: event.promise
    });
  });

  // Global error logger
  window.addEventListener('error', (event) => {
    logger.log('error', 'GlobalError', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }, event.error);
  });
}