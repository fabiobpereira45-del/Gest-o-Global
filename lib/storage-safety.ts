
/**
 * Safe storage wrapper to prevent "SecurityError: Access is denied for this document"
 * when browser storage (localStorage/sessionStorage) is restricted or blocked.
 */

class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

export const safeLocalStorage: Storage = isStorageAvailable('localStorage') 
  ? window.localStorage 
  : new MemoryStorage();

export const safeSessionStorage: Storage = isStorageAvailable('sessionStorage') 
  ? window.sessionStorage 
  : new MemoryStorage();

/**
 * Supabase-compatible storage object
 */
export const supabaseSafeStorage = {
  getItem: (key: string) => {
    try {
      return safeLocalStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      safeLocalStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  },
  removeItem: (key: string) => {
    try {
      safeLocalStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};
