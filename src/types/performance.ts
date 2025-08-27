/**
 * Performance and optimization type definitions
 */

import { ProjectFile } from '../../types';

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

// File operation types
export interface FileStats {
  totalFiles: number;
  totalSize: number;
  dirtyFiles: number;
  fileTypes: { [extension: string]: number };
  largestFile: ProjectFile | null;
  smallestFile: ProjectFile | null;
}

export interface FileOperationProgress {
  current: number;
  total: number;
  currentFile?: string;
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface GitHubValidation extends ValidationResult {
  owner?: string;
  repo?: string;
}

// Search and filter types
export interface SearchOptions {
  query: string;
  searchContent: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
}

export interface FilterOptions {
  extensions?: string[];
  directories?: string[];
  modifiedOnly?: boolean;
  sizeRange?: {
    min: number;
    max: number;
  };
}

// Rate limiting types
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime: number;
}

export interface RateLimitError extends Error {
  retryAfter: number;
  limit: number;
}

// Storage types
export interface StorageQuota {
  usage: number;
  quota: number;
  available: number;
}

export interface BackupInfo {
  timestamp: number;
  projectCount: number;
  totalSize: number;
  encrypted: boolean;
}

// Error types
export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  stackTrace?: string;
  reproductionSteps?: string[];
}

// Debounce and throttle types
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
};

export type ThrottledFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

// Virtual list types
export interface VirtualListItem<T = any> {
  id: string | number;
  height: number;
  data: T;
}

export interface VirtualListState {
  scrollTop: number;
  visibleStart: number;
  visibleEnd: number;
  totalHeight: number;
}

// Memory optimization types
export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  expiresAt?: number;
  accessCount: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

// Component optimization types
export interface ComponentMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryLeaks: number;
}

export interface OptimizationHints {
  shouldMemo: boolean;
  shouldLazy: boolean;
  shouldVirtualize: boolean;
  heavyProps: string[];
}

// Network optimization types
export interface NetworkMetrics {
  latency: number;
  bandwidth: number;
  offline: boolean;
  effectiveType: string;
}

export interface CacheStrategy {
  type: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  ttl: number;
  maxSize: number;
  compression: boolean;
}

// Bundle optimization types
export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  duplicates: string[];
  unusedExports: string[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  isEntry: boolean;
  isVendor: boolean;
}

// Security optimization types
export interface SecurityMetrics {
  cspViolations: number;
  xssAttempts: number;
  suspiciousPatterns: string[];
  lastSecurityScan: number;
}

export interface SecurityConfig {
  enableCSP: boolean;
  sanitizeInputs: boolean;
  encryptStorage: boolean;
  auditEnabled: boolean;
}