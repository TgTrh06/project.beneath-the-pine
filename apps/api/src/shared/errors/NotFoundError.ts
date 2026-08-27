import { AppError } from "./AppError.js";
export class NotFoundError extends AppError { public readonly code = "NOT_FOUND"; public readonly statusCode = 404; }
