import { AppError } from "./AppError.js";
export class ValidationError extends AppError { public readonly code = "INVALID_REQUEST"; public readonly statusCode = 400; }
