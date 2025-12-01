interface CircuitState {
    failures: number;
    lastFailure: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    openedAt?: number;
}

const circuitStates = new Map<string, CircuitState>();

const COOLDOWN_MS = 30000;
const FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 60000;
const HALF_OPEN_SUCCESS_THRESHOLD = 2;

function getCircuitState(service: string): CircuitState {
    return circuitStates.get(service) || { failures: 0, lastFailure: 0, state: 'CLOSED' };
}

function recordFailure(service: string): void {
    const now = Date.now();
    const circuit = getCircuitState(service);
    
    circuit.failures++;
    circuit.lastFailure = now;
    
    if (circuit.failures >= FAILURE_THRESHOLD && circuit.state === 'CLOSED') {
        circuit.state = 'OPEN';
        circuit.openedAt = now;
    }
    
    circuitStates.set(service, circuit);
}

function recordSuccess(service: string): void {
    const circuit = getCircuitState(service);
    
    if (circuit.state === 'HALF_OPEN') {
        circuit.failures = Math.max(0, circuit.failures - 1);
        if (circuit.failures < HALF_OPEN_SUCCESS_THRESHOLD) {
            circuit.state = 'CLOSED';
        }
    } else {
        circuit.failures = 0;
    }
    
    circuitStates.set(service, circuit);
}

function isCircuitOpen(service: string): boolean {
    const now = Date.now();
    const circuit = getCircuitState(service);
    
    if (circuit.state === 'OPEN') {
        // Check if we should try again (half-open)
        if (circuit.openedAt && now - circuit.openedAt > CIRCUIT_RESET_MS) {
            circuit.state = 'HALF_OPEN';
            circuitStates.set(service, circuit);
            return false;
        }
        return true;
    }
    
    return false;
}

function isNetworkError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return (
        error?.name === 'TimeoutError' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ENOTFOUND' ||
        message.includes('timeout') ||
        message.includes('connect') ||
        message.includes('network') ||
        message.includes('fetch failed') ||
        message.includes('econnrefused')
    );
}

function isRateLimitError(error: any): boolean {
    return (
        error?.status === 429 || 
        error?.code === 429 ||
        error?.message?.includes('429') || 
        error?.message?.includes('Too Many Requests') ||
        error?.message?.includes('quota')
    );
}

function isRetryableError(error: any): boolean {
    // Network errors and rate limits are retryable
    if (isNetworkError(error) || isRateLimitError(error)) return true;
    
    const status = error?.status || error?.statusCode;
    if (status >= 500 && status < 600) return true;
    
    return false;
}

export async function runWithRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelayMs?: number;
        service?: string; // For circuit breaker tracking
        skipOnFailure?: boolean; // If true, fail fast on network errors
    } | number = {} // backwards compatible with old (retries) parameter
): Promise<T> {
    const opts = typeof options === 'number' 
        ? { maxRetries: options, baseDelayMs: 2000, service: 'default', skipOnFailure: false }
        : {
            maxRetries: options.maxRetries ?? 3,
            baseDelayMs: options.baseDelayMs ?? 2000,
            service: options.service ?? 'default',
            skipOnFailure: options.skipOnFailure ?? false
          };
    
    const { maxRetries, baseDelayMs, service, skipOnFailure } = opts;
    
    if (isCircuitOpen(service)) {
        const err = new Error(`Service ${service} is temporarily unavailable (circuit open)`);
        (err as any).circuitOpen = true;
        throw err;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await fn();
            recordSuccess(service);
            return result;
        } catch (error: any) {
            lastError = error;

            if (isRateLimitError(error)) {
                recordFailure(service);
                await sleep(COOLDOWN_MS);
                continue;
            }

            if (isNetworkError(error)) {
                recordFailure(service);
                
                if (skipOnFailure) {
                    throw error;
                }
                
                if (isCircuitOpen(service)) {
                    throw error;
                }
                
                if (attempt < maxRetries) {
                    const delay = Math.min(baseDelayMs * Math.pow(1.5, attempt), 10000);
                    await sleep(delay);
                    continue;
                }
            }

            if (isRetryableError(error) && attempt < maxRetries) {
                recordFailure(service);
                const delay = baseDelayMs * Math.pow(2, attempt);
                await sleep(delay);
                continue;
            }

            if (!isRetryableError(error)) {
                throw error;
            }
        }
    }

    recordFailure(service);
    throw lastError;
}

export async function processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
        concurrency?: number;
        delayBetweenBatches?: number;
        onItemComplete?: (item: T, result: R | null, error: Error | null, index: number) => void;
    } = {}
): Promise<{ results: (R | null)[]; errors: (Error | null)[] }> {
    const {
        concurrency = 2,
        delayBetweenBatches = 2000,
        onItemComplete
    } = options;
    
    const results: (R | null)[] = new Array(items.length).fill(null);
    const errors: (Error | null)[] = new Array(items.length).fill(null);
    
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchIndices = batch.map((_, idx) => i + idx);
        
        const batchPromises = batch.map((item, batchIdx) => 
            processor(item)
                .then(result => ({ status: 'fulfilled' as const, value: result, index: batchIndices[batchIdx] }))
                .catch(error => ({ status: 'rejected' as const, reason: error, index: batchIndices[batchIdx] }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results[result.index] = result.value;
                onItemComplete?.(items[result.index], result.value, null, result.index);
            } else {
                errors[result.index] = result.reason;
                onItemComplete?.(items[result.index], null, result.reason, result.index);
            }
        }
        
        if (i + concurrency < items.length) {
            await sleep(delayBetweenBatches);
        }
    }
    
    return { results, errors };
}

export function resetCircuit(service: string): void {
    circuitStates.delete(service);
}

export function getCircuitStatus(): Record<string, CircuitState> {
    const status: Record<string, CircuitState> = {};
    circuitStates.forEach((state, service) => {
        status[service] = { ...state };
    });
    return status;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
