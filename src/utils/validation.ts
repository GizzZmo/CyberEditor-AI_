/**
 * Input validation and sanitization utilities
 */

import { FILE_SYSTEM, SECURITY } from '../config/constants';

/**
 * Sanitizes a string by removing or escaping potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove null bytes and control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validates a project name
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Project name is required' };
  }
  
  const sanitized = sanitizeString(name.trim());
  
  if (sanitized.length === 0) {
    return { valid: false, error: 'Project name cannot be empty' };
  }
  
  if (sanitized.length > 50) {
    return { valid: false, error: 'Project name must be 50 characters or less' };
  }
  
  // Check for invalid characters in project names
  if (!/^[a-zA-Z0-9\-_.\s]+$/.test(sanitized)) {
    return { valid: false, error: 'Project name contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Validates a file path
 */
export function validateFilePath(path: string): { valid: boolean; error?: string } {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'File path is required' };
  }
  
  const sanitized = sanitizeString(path.trim());
  
  if (sanitized.length === 0) {
    return { valid: false, error: 'File path cannot be empty' };
  }
  
  if (sanitized.length > 260) { // Windows MAX_PATH limitation
    return { valid: false, error: 'File path too long' };
  }
  
  // Check for dangerous path patterns
  if (sanitized.includes('..') || sanitized.startsWith('/') || sanitized.includes('\\')) {
    return { valid: false, error: 'File path contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Validates file content size
 */
export function validateFileContent(content: string): { valid: boolean; error?: string } {
  if (typeof content !== 'string') {
    return { valid: false, error: 'File content must be a string' };
  }
  
  const sizeInBytes = new Blob([content]).size;
  
  if (sizeInBytes > FILE_SYSTEM.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large (${Math.round(sizeInBytes / 1024 / 1024)}MB). Maximum size is ${FILE_SYSTEM.MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }
  
  return { valid: true };
}

/**
 * Validates GitHub repository URL format
 */
export function validateGitHubUrl(url: string): { valid: boolean; owner?: string; repo?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeString(url.trim());
  
  // Match GitHub repository URLs
  const match = sanitized.match(/^https?:\/\/github\.com\/([a-zA-Z0-9\-._]+)\/([a-zA-Z0-9\-._]+)(?:\.git)?(?:\/.*)?$/);
  
  if (!match) {
    return { valid: false, error: 'Invalid GitHub repository URL' };
  }
  
  const [, owner, repo] = match;
  
  if (!owner || !repo) {
    return { valid: false, error: 'Could not parse owner and repository name' };
  }
  
  return { valid: true, owner, repo };
}

/**
 * Validates GitHub token format
 */
export function validateGitHubToken(token: string): { valid: boolean; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is required' };
  }
  
  const sanitized = sanitizeString(token.trim());
  
  if (sanitized.length === 0) {
    return { valid: false, error: 'Token cannot be empty' };
  }
  
  // GitHub tokens should start with specific prefixes
  if (!sanitized.match(/^(ghp_|github_pat_)/)) {
    return { valid: false, error: 'Token format appears to be invalid' };
  }
  
  if (sanitized.length < 40) {
    return { valid: false, error: 'Token appears to be too short' };
  }
  
  return { valid: true };
}

/**
 * Rate limiting utility
 */
class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number = SECURITY.RATE_LIMIT_REQUESTS,
    private windowMs: number = SECURITY.RATE_LIMIT_WINDOW
  ) {}
  
  /**
   * Check if a request is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if we're under the limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    this.requests.push(now);
    return true;
  }
  
  /**
   * Get time until next request is allowed (in ms)
   */
  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}

// Export rate limiter instances for different services
export const aiRateLimiter = new RateLimiter();
export const githubRateLimiter = new RateLimiter(60, 60 * 1000); // GitHub allows 60 requests per minute