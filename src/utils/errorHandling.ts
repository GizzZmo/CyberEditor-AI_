/**
 * Centralized error handling utilities
 */

import { ERROR_MESSAGES } from '../config/constants';

/**
 * Application error types
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK', 
  AUTH = 'AUTH',
  AI_SERVICE = 'AI_SERVICE',
  GITHUB = 'GITHUB',
  STORAGE = 'STORAGE',
  RATE_LIMIT = 'RATE_LIMIT',
  SYSTEM = 'SYSTEM',
}

/**
 * Application error class with additional context
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public code?: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
  
  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return ERROR_MESSAGES.NETWORK_ERROR;
      case ErrorType.AUTH:
        return ERROR_MESSAGES.GITHUB_AUTH_ERROR;
      case ErrorType.AI_SERVICE:
        return ERROR_MESSAGES.AI_SERVICE_ERROR;
      case ErrorType.RATE_LIMIT:
        return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
      default:
        return this.message;
    }
  }
  
  /**
   * Check if error should be logged for debugging
   */
  shouldLog(): boolean {
    return this.type === ErrorType.SYSTEM || this.type === ErrorType.AI_SERVICE;
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handle and format errors consistently
   */
  static handle(error: unknown, context?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      // Classify error based on message content
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch')) {
        return new AppError(ErrorType.NETWORK, error.message, undefined, { context });
      }
      
      if (message.includes('auth') || message.includes('token') || message.includes('credentials')) {
        return new AppError(ErrorType.AUTH, this.sanitizeErrorMessage(error.message), undefined, { context });
      }
      
      if (message.includes('rate limit') || message.includes('too many requests')) {
        return new AppError(ErrorType.RATE_LIMIT, error.message, undefined, { context });
      }
      
      if (message.includes('ai') || message.includes('gemini') || message.includes('api')) {
        return new AppError(ErrorType.AI_SERVICE, error.message, undefined, { context });
      }
      
      return new AppError(ErrorType.SYSTEM, error.message, undefined, { context });
    }
    
    // Unknown error type
    return new AppError(
      ErrorType.SYSTEM, 
      'An unexpected error occurred', 
      undefined, 
      { originalError: error, context }
    );
  }
  
  /**
   * Sanitize error messages to prevent information leakage
   */
  private static sanitizeErrorMessage(message: string): string {
    // Remove potential API keys, tokens, and sensitive data
    return message
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '[GITHUB_TOKEN]')
      .replace(/AIza[a-zA-Z0-9-_]{35}/g, '[API_KEY]')
      .replace(/sk-[a-zA-Z0-9]{48}/g, '[SECRET_KEY]')
      .replace(/Bearer\s+[a-zA-Z0-9-._~+/]+=*/g, '[BEARER_TOKEN]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  }
  
  /**
   * Log error with appropriate level
   */
  static log(error: AppError): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      context: error.context,
      stack: error.shouldLog() ? error.stack : undefined,
    };
    
    if (error.shouldLog()) {
      console.error('[AppError]', logData);
    } else {
      console.warn('[AppError]', logData);
    }
  }
  
  /**
   * Create validation error
   */
  static validation(message: string, field?: string): AppError {
    return new AppError(ErrorType.VALIDATION, message, field);
  }
  
  /**
   * Create network error
   */
  static network(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(ErrorType.NETWORK, message, undefined, context);
  }
  
  /**
   * Create authentication error
   */
  static auth(message: string): AppError {
    return new AppError(ErrorType.AUTH, this.sanitizeErrorMessage(message));
  }
  
  /**
   * Create AI service error
   */
  static aiService(message: string): AppError {
    return new AppError(ErrorType.AI_SERVICE, message);
  }
  
  /**
   * Create GitHub error
   */
  static github(message: string): AppError {
    return new AppError(ErrorType.GITHUB, this.sanitizeErrorMessage(message));
  }
  
  /**
   * Create rate limit error
   */
  static rateLimit(): AppError {
    return new AppError(ErrorType.RATE_LIMIT, ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * Async error boundary for handling promise rejections
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = ErrorHandler.handle(error, context);
      ErrorHandler.log(appError);
      throw appError;
    }
  }) as T;
}

/**
 * React error boundary helper
 */
export function getErrorBoundaryFallback(error: Error): React.ReactElement {
  const appError = ErrorHandler.handle(error, 'ErrorBoundary');
  ErrorHandler.log(appError);
  
  return React.createElement('div', {
    className: 'error-boundary p-4 bg-red-900/20 border border-red-500 rounded-md',
  }, [
    React.createElement('h3', { key: 'title', className: 'text-red-400 font-bold mb-2' }, 'Something went wrong'),
    React.createElement('p', { key: 'message', className: 'text-red-300' }, appError.getUserMessage()),
    React.createElement('button', {
      key: 'reload',
      className: 'mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700',
      onClick: () => window.location.reload(),
    }, 'Reload Page'),
  ]);
}