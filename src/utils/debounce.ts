// src/utils/debounce.ts

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Creates a debounced function with promise support.
 * Useful for async operations like API calls.
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let promiseResolve: ((value: ReturnType<T>) => void) | null = null;
  let promiseReject: ((reason?: any) => void) | null = null;

  return function debouncedAsync(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        if (promiseReject) {
          promiseReject(new Error('Debounced call cancelled'));
        }
      }

      promiseResolve = resolve;
      promiseReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (promiseResolve) {
            promiseResolve(result);
          }
        } catch (error) {
          if (promiseReject) {
            promiseReject(error);
          }
        }
      }, wait);
    });
  };
}