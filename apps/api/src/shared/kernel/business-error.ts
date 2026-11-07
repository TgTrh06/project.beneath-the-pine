export type BusinessErrorCode = 'VALIDATION_FAILED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'STATE_CONFLICT' | 'RATE_LIMITED';

/** Contains no input text, SQL or transport/framework types. */
export class BusinessError extends Error {
  constructor(readonly code: BusinessErrorCode) { super(code); this.name = 'BusinessError'; }
}
