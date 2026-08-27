import { AppError } from "./AppError.js";
export class ForbiddenError extends AppError { public readonly code = "FORBIDDEN"; public readonly statusCode = 403; }
