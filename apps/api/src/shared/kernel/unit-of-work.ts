declare const transactionBrand: unique symbol;

/** Opaque, short-lived capability. Only the owning infrastructure adapter can resolve it. */
export interface TransactionContext { readonly [transactionBrand]: true; }
export interface TransactionOptions {
  readonly isolationLevel?: 'read committed' | 'repeatable read' | 'serializable';
}
export interface UnitOfWork {
  run<T>(work: (context: TransactionContext) => Promise<T>, options?: TransactionOptions): Promise<T>;
}
export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
