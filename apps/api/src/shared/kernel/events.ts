export interface EventSubscription { unsubscribe(): void; }
export interface EventSource<T> { subscribe(listener: (value: T) => void): EventSubscription; }
export interface EventChannel<T> extends EventSource<T> { next(value: T): void; }
