/**
 * Performance optimization hooks
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UI_CONFIG } from '../config/constants';

/**
 * Debounced value hook for performance optimization
 */
export function useDebounce<T>(value: T, delay: number = UI_CONFIG.DEBOUNCE_DELAY): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = UI_CONFIG.DEBOUNCE_DELAY
): T {
    const timeoutRef = useRef<NodeJS.Timeout>();

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    ) as T;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = UI_CONFIG.DEBOUNCE_DELAY
): T {
    const lastCallTime = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const throttledCallback = useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            const timeSinceLastCall = now - lastCallTime.current;

            if (timeSinceLastCall >= delay) {
                lastCallTime.current = now;
                callback(...args);
            } else {
                // Schedule the call for the remaining time
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                
                timeoutRef.current = setTimeout(() => {
                    lastCallTime.current = Date.now();
                    callback(...args);
                }, delay - timeSinceLastCall);
            }
        },
        [callback, delay]
    ) as T;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return throttledCallback;
}

/**
 * Memoized expensive calculation hook
 */
export function useExpensiveCalculation<T>(
    calculateFn: () => T,
    deps: React.DependencyList
): T {
    return useMemo(calculateFn, deps);
}

/**
 * Previous value hook for comparison
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();
    
    useEffect(() => {
        ref.current = value;
    }, [value]);
    
    return ref.current;
}

/**
 * Force update hook
 */
export function useForceUpdate() {
    const [, setTick] = useState(0);
    return useCallback(() => {
        setTick(tick => tick + 1);
    }, []);
}

/**
 * Local storage hook with SSR safety
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                // Allow value to be a function so we have the same API as useState
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
    elementRef: React.RefObject<Element>,
    options?: IntersectionObserverInit
): boolean {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            options
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [elementRef, options]);

    return isIntersecting;
}

/**
 * Media query hook for responsive design
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

/**
 * Window size hook
 */
export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}