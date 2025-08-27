/**
 * Environment configuration with proper validation
 * This helps centralize environment variable access and adds validation
 */

interface EnvironmentConfig {
  readonly geminiApiKey: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

/**
 * Validates and returns environment configuration
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): EnvironmentConfig {
  // Note: In a production app, the API key should never be exposed to the client
  // This is a limitation of the current architecture where AI calls are made from the client
  // Ideally, this should be moved to a backend service
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey || geminiApiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is required. Please set VITE_GEMINI_API_KEY in your environment variables. ' +
      'WARNING: This exposes the API key to the client. In production, move AI calls to a backend service.'
    );
  }

  return {
    geminiApiKey,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
}

// Validate environment on module load
export const env = validateEnvironment();

// Additional security warning for production
if (env.isProduction) {
  console.warn(
    '⚠️ SECURITY WARNING: API keys are exposed to the client. ' +
    'In production, consider moving AI operations to a backend service.'
  );
}