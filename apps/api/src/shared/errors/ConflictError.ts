import { AppError } from "./AppError.js";
export class ConflictError extends AppError { public readonly code = "CONFLICT"; public readonly statusCode = 409; }
