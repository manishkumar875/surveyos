export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
    details?: unknown;
  }) {
    super(params.message);

    this.name = 'AppError';
    this.statusCode = params.statusCode ?? 500;
    this.code = params.code ?? 'INTERNAL_SERVER_ERROR';
    this.isOperational = params.isOperational ?? true;
    this.details = params.details;

    Error.captureStackTrace(this, this.constructor);
  }
}
