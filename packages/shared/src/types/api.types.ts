export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export type HealthCheckResponse = {
  service: string;
  status: 'ok';
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
};
