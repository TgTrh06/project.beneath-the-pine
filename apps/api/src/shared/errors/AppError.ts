export abstract class AppError extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;

  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
