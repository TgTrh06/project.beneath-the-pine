export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details: { field: string; code: string }[] = [],
  ) {
    super(message);
  }
}
