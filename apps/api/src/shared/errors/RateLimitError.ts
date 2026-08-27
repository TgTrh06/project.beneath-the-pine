import { AppError } from "./AppError.js";
export class RateLimitError extends AppError { public readonly code = "QUOTA_EXCEEDED"; public readonly statusCode = 429; }
