/**
 * Generic debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Debounce manager for handling multiple debounced operations with different keys
 */
export class DebounceManager {
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Execute a function with debouncing based on a key
   */
  debounce<T extends (...args: unknown[]) => unknown>(
    key: string,
    func: T,
    delay: number,
    ...args: Parameters<T>
  ): void {
    // Clear existing timeout for this key
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      func(...args);
      this.timeouts.delete(key);
    }, delay);

    this.timeouts.set(key, timeout);
  }

  /**
   * Clear all pending debounced operations
   */
  clearAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * Clear a specific debounced operation
   */
  clear(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * Check if a debounced operation is pending
   */
  isPending(key: string): boolean {
    return this.timeouts.has(key);
  }
} 