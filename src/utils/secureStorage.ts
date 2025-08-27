/**
 * Secure storage utilities for sensitive data
 */

import { STORAGE_KEYS } from '../config/constants';

/**
 * Simple XOR encryption for localStorage (basic obfuscation)
 * Note: This is not cryptographically secure, but provides basic protection
 * For production applications, consider using Web Crypto API or server-side storage
 */
class SimpleEncoder {
  private key: string;
  
  constructor() {
    // Generate a simple key based on browser fingerprint
    this.key = this.generateKey();
  }
  
  private generateKey(): string {
    const userAgent = navigator.userAgent;
    const screenInfo = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return btoa(userAgent + screenInfo + timezone).slice(0, 32);
  }
  
  encode(data: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i);
      const keyChar = this.key.charCodeAt(i % this.key.length);
      result += String.fromCharCode(dataChar ^ keyChar);
    }
    return btoa(result);
  }
  
  decode(encodedData: string): string {
    try {
      const data = atob(encodedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        const dataChar = data.charCodeAt(i);
        const keyChar = this.key.charCodeAt(i % this.key.length);
        result += String.fromCharCode(dataChar ^ keyChar);
      }
      return result;
    } catch {
      throw new Error('Failed to decode data');
    }
  }
}

const encoder = new SimpleEncoder();

/**
 * Secure storage interface
 */
export interface SecureStorageOptions {
  encrypt?: boolean;
  fallback?: any;
}

/**
 * Secure localStorage wrapper
 */
export class SecureStorage {
  /**
   * Store data securely in localStorage
   */
  static setItem<T>(key: string, value: T, options: SecureStorageOptions = {}): void {
    try {
      const serialized = JSON.stringify(value);
      const dataToStore = options.encrypt ? encoder.encode(serialized) : serialized;
      localStorage.setItem(key, dataToStore);
    } catch (error) {
      console.error(`Failed to store data for key "${key}":`, error);
      throw new Error('Storage operation failed');
    }
  }
  
  /**
   * Retrieve data securely from localStorage
   */
  static getItem<T>(key: string, options: SecureStorageOptions = {}): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return options.fallback || null;
      }
      
      const dataToDeserialize = options.encrypt ? encoder.decode(stored) : stored;
      return JSON.parse(dataToDeserialize);
    } catch (error) {
      console.error(`Failed to retrieve data for key "${key}":`, error);
      return options.fallback || null;
    }
  }
  
  /**
   * Remove data from localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove data for key "${key}":`, error);
    }
  }
  
  /**
   * Clear all stored data
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

/**
 * Specialized storage functions for application data
 */
export const projectStorage = {
  save: (projects: any) => {
    SecureStorage.setItem(STORAGE_KEYS.PROJECTS, projects);
  },
  
  load: () => {
    return SecureStorage.getItem(STORAGE_KEYS.PROJECTS, { fallback: {} });
  },
  
  clear: () => {
    SecureStorage.removeItem(STORAGE_KEYS.PROJECTS);
  }
};

export const settingsStorage = {
  save: (settings: any) => {
    // Encrypt settings since they may contain sensitive tokens
    SecureStorage.setItem(STORAGE_KEYS.SETTINGS, settings, { encrypt: true });
  },
  
  load: () => {
    return SecureStorage.getItem(STORAGE_KEYS.SETTINGS, { 
      encrypt: true, 
      fallback: { theme: 'cyan', githubToken: null, githubUser: null } 
    });
  },
  
  clear: () => {
    SecureStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
};

/**
 * Migration utility for existing localStorage data
 */
export function migrateExistingData(): void {
  try {
    // Migrate projects (no encryption needed)
    const existingProjects = localStorage.getItem('cyber-editor-projects');
    if (existingProjects) {
      try {
        const projects = JSON.parse(existingProjects);
        projectStorage.save(projects);
        console.log('Successfully migrated project data');
      } catch (e) {
        console.warn('Failed to migrate project data:', e);
      }
    }
    
    // Migrate settings (with encryption)
    const existingSettings = localStorage.getItem('cyber-editor-settings');
    if (existingSettings) {
      try {
        const settings = JSON.parse(existingSettings);
        settingsStorage.save(settings);
        // Remove old unencrypted data
        localStorage.removeItem('cyber-editor-settings');
        console.log('Successfully migrated settings data with encryption');
      } catch (e) {
        console.warn('Failed to migrate settings data:', e);
      }
    }
  } catch (error) {
    console.warn('Data migration failed:', error);
  }
}