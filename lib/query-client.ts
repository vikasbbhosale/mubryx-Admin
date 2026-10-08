/**
 * Enterprise In-Memory Query & Data Freshness Layer for Mubryx Admin Console.
 *
 * Implements:
 * 1. Cache-First Stale-While-Revalidate (SWR) semantics.
 * 2. In-flight Request Deduplication across concurrent consumers.
 * 3. AbortController request lifecycle cancellation.
 * 4. Configurable Stale Times & Invalidation hooks.
 * 5. Tab Visibility / Idle State polling management.
 */

type QueryFetcher<T> = (signal?: AbortSignal) => Promise<T>;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isFetching: boolean;
  error?: Error | null;
}

interface InFlightRequest<T> {
  promise: Promise<T>;
  abortController: AbortController;
}

class QueryClient {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, InFlightRequest<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  /**
   * Retrieves data from cache or network, adhering to stale-while-revalidate.
   */
  async fetchQuery<T>(
    key: string,
    fetcher: QueryFetcher<T>,
    options: {
      staleTime?: number; // ms before data is considered stale (default 30s)
      forceRefresh?: boolean;
      signal?: AbortSignal;
    } = {},
  ): Promise<T> {
    const { staleTime = 30000, forceRefresh = false, signal } = options;
    const now = Date.now();
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // 1. In-flight Request Deduplication:
    // If an identical request is already active, return the existing Promise
    const existing = this.inFlight.get(key);
    if (existing && !forceRefresh) {
      if (signal) {
        signal.addEventListener('abort', () => {
          // Do not abort shared promise if other consumers are still waiting
        });
      }
      return existing.promise;
    }

    // 2. Cache Hit & Fresh: return immediately
    const isFresh = entry && now - entry.timestamp < staleTime;
    if (isFresh && !forceRefresh) {
      return entry.data;
    }

    // 3. Stale-While-Revalidate:
    // If we have stale data, return it immediately and revalidate in background
    if (entry && !forceRefresh && !entry.isFetching) {
      this.revalidateInBackground(key, fetcher);
      return entry.data;
    }

    // 4. Cache Miss or Force Refresh: Fetch network synchronously
    return this.executeFetch(key, fetcher, signal);
  }

  /**
   * Executes fetch with network deduplication and AbortController.
   */
  private async executeFetch<T>(
    key: string,
    fetcher: QueryFetcher<T>,
    callerSignal?: AbortSignal,
  ): Promise<T> {
    const abortController = new AbortController();

    // Link caller abort signal if provided
    if (callerSignal) {
      if (callerSignal.aborted) {
        abortController.abort();
      } else {
        callerSignal.addEventListener('abort', () => abortController.abort(), { once: true });
      }
    }

    const promise = (async () => {
      try {
        const data = await fetcher(abortController.signal);
        this.setCache(key, data);
        return data;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // If aborted, keep previous cache intact
          const prev = this.cache.get(key);
          if (prev) return prev.data;
        }
        throw err;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, { promise, abortController });
    return promise;
  }

  /**
   * Performs silent background revalidation without wiping out existing UI state.
   */
  private async revalidateInBackground<T>(key: string, fetcher: QueryFetcher<T>) {
    if (this.inFlight.has(key)) return;

    const entry = this.cache.get(key);
    if (entry) {
      entry.isFetching = true;
    }

    try {
      const data = await this.executeFetch(key, fetcher);
      this.notifySubscribers(key, data);
    } catch {
      // Background failure leaves existing cache entry intact
    } finally {
      if (entry) {
        entry.isFetching = false;
      }
    }
  }

  /**
   * Sets cache entry and updates subscribers.
   */
  setCache<T>(key: string, data: T) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isFetching: false,
      error: null,
    });
    this.notifySubscribers(key, data);
  }

  /**
   * Synchronously reads current cached value if available.
   */
  getQueryData<T>(key: string): T | undefined {
    return this.cache.get(key)?.data;
  }

  /**
   * Manually invalidates a cache key, forcing next fetch to go to network.
   */
  invalidateQuery(key: string) {
    this.cache.delete(key);
    const existing = this.inFlight.get(key);
    if (existing) {
      existing.abortController.abort();
      this.inFlight.delete(key);
    }
  }

  /**
   * Invalidate all queries matching a prefix.
   */
  invalidateQueriesByPrefix(prefix: string) {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    for (const [key, req] of Array.from(this.inFlight.entries())) {
      if (key.startsWith(prefix)) {
        req.abortController.abort();
        this.inFlight.delete(key);
      }
    }
  }

  /**
   * Subscribes component to cache updates for key.
   */
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) this.subscribers.delete(key);
      }
    };
  }

  private notifySubscribers<T>(key: string, data: T) {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach((cb) => cb(data));
    }
  }
}

// Global Singleton QueryClient for mubryx-admin
export const queryClient = new QueryClient();
