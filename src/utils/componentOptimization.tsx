/**
 * Higher-order component utilities for performance optimization
 */

import React, { memo, forwardRef } from 'react';

/**
 * Enhanced memo with custom comparison function
 */
export function createMemoComponent<T extends React.ComponentType<any>>(
    Component: T,
    propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): T {
    return memo(Component, propsAreEqual) as T;
}

/**
 * Memo for components that only care about specific props
 */
export function memoWithProps<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    watchedProps: (keyof T)[]
) {
    return memo(Component, (prevProps, nextProps) => {
        return watchedProps.every(prop => prevProps[prop] === nextProps[prop]);
    });
}

/**
 * Memo for components with deep comparison on specific props
 */
export function memoWithDeepProps<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    deepProps: (keyof T)[]
) {
    return memo(Component, (prevProps, nextProps) => {
        // Shallow comparison for non-deep props
        const shallowPropsEqual = Object.keys(prevProps).every(key => {
            if (deepProps.includes(key as keyof T)) return true;
            return prevProps[key] === nextProps[key];
        });

        if (!shallowPropsEqual) return false;

        // Deep comparison for specified props
        return deepProps.every(prop => {
            return JSON.stringify(prevProps[prop]) === JSON.stringify(nextProps[prop]);
        });
    });
}

/**
 * Memo component that ignores function props for comparison
 */
export function memoIgnoringFunctions<T extends Record<string, any>>(
    Component: React.ComponentType<T>
) {
    return memo(Component, (prevProps, nextProps) => {
        const prevKeys = Object.keys(prevProps).filter(key => typeof prevProps[key] !== 'function');
        const nextKeys = Object.keys(nextProps).filter(key => typeof nextProps[key] !== 'function');

        if (prevKeys.length !== nextKeys.length) return false;

        return prevKeys.every(key => prevProps[key] === nextProps[key]);
    });
}

/**
 * Performance monitoring HOC
 */
export function withPerformanceMonitoring<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    componentName: string
) {
    return memo(forwardRef<any, T>((props, ref) => {
        const startTime = performance.now();

        React.useEffect(() => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            if (renderTime > 16) { // More than one frame (16ms)
                console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
            }
        });

        return <Component {...props} ref={ref} />;
    }));
}

/**
 * Lazy loading wrapper for components
 */
export function createLazyComponent<T extends Record<string, any>>(
    importFunction: () => Promise<{ default: React.ComponentType<T> }>,
    fallback: React.ComponentElement<any> = <div>Loading...</div>
) {
    const LazyComponent = React.lazy(importFunction);
    
    return (props: T) => (
        <React.Suspense fallback={fallback}>
            <LazyComponent {...props} />
        </React.Suspense>
    );
}

/**
 * Error boundary HOC
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export function withErrorBoundary<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    fallback?: (error: Error) => React.ReactElement
) {
    return class ErrorBoundaryWrapper extends React.Component<T, ErrorBoundaryState> {
        constructor(props: T) {
            super(props);
            this.state = { hasError: false };
        }

        static getDerivedStateFromError(error: Error): ErrorBoundaryState {
            return { hasError: true, error };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
            console.error('Component error caught by boundary:', error, errorInfo);
        }

        render() {
            if (this.state.hasError && this.state.error) {
                if (fallback) {
                    return fallback(this.state.error);
                }
                
                return (
                    <div className="error-boundary p-4 bg-red-900/20 border border-red-500 rounded-md">
                        <h3 className="text-red-400 font-bold mb-2">Something went wrong</h3>
                        <p className="text-red-300 mb-3">{this.state.error.message}</p>
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                        >
                            Try Again
                        </button>
                    </div>
                );
            }

            return <Component {...this.props} />;
        }
    };
}

/**
 * Render optimization for large lists
 */
export interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactElement;
    overscan?: number;
}

export function VirtualizedList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
}: VirtualizedListProps<T>) {
    const [scrollTop, setScrollTop] = React.useState(0);

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight),
        items.length - 1
    );

    const paddingTop = Math.max(0, (visibleStart - overscan) * itemHeight);
    const paddingBottom = Math.max(0, (items.length - visibleEnd - 1 - overscan) * itemHeight);

    const visibleItems = items.slice(
        Math.max(0, visibleStart - overscan),
        Math.min(items.length, visibleEnd + 1 + overscan)
    );

    return (
        <div
            style={{ height: containerHeight, overflow: 'auto' }}
            onScroll={(e) => setScrollTop((e.target as HTMLElement).scrollTop)}
        >
            <div style={{ paddingTop, paddingBottom }}>
                {visibleItems.map((item, index) => {
                    const actualIndex = Math.max(0, visibleStart - overscan) + index;
                    return (
                        <div key={actualIndex} style={{ height: itemHeight }}>
                            {renderItem(item, actualIndex)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Debounced component re-render
 */
export function withDebouncedRender<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    delay: number = 300
) {
    return (props: T) => {
        const [debouncedProps, setDebouncedProps] = React.useState(props);

        React.useEffect(() => {
            const timer = setTimeout(() => {
                setDebouncedProps(props);
            }, delay);

            return () => clearTimeout(timer);
        }, [props, delay]);

        return <Component {...debouncedProps} />;
    };
}