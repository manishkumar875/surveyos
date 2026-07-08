import { getAccessToken, clearAccessToken } from './auth-storage';

export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
};

interface FetchOptions extends RequestInit {
  data?: unknown;
  params?: Record<string, string>;
}

async function fetchClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, params, headers: customHeaders, ...customConfig } = options;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const baseUrl = getBaseUrl();
  let url = `${baseUrl}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      clearAccessToken();
      // Only redirect on client side if window is available
      if (typeof window !== 'undefined' && window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
      throw new ApiError(401, 'Unauthorized');
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = (isJson ? await response.json() : await response.text()) as unknown;

    if (!response.ok) {
      const parsedData = responseData as { message?: string };
      const errorMessage =
        (parsedData && typeof parsedData === 'object' && parsedData.message) ||
        response.statusText ||
        'An error occurred while fetching data';
      throw new ApiError(response.status, String(errorMessage), responseData);
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error or unable to fetch data', error);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    fetchClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: Omit<FetchOptions, 'method' | 'data'>) =>
    fetchClient<T>(endpoint, { ...options, data, method: 'POST' }),

  patch: <T>(endpoint: string, data?: unknown, options?: Omit<FetchOptions, 'method' | 'data'>) =>
    fetchClient<T>(endpoint, { ...options, data, method: 'PATCH' }),

  delete: <T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    fetchClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
