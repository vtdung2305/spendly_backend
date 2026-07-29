import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain-level exception carrying a machine-readable SCREAMING_SNAKE error code,
 * so use-cases can throw business errors without knowing about HTTP.
 */
export class AppException extends HttpException {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST, details?: unknown) {
    super(message, status);
    this.code = code;
    this.details = details;
  }
}
