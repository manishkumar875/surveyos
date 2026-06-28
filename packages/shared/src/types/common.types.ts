export type Environment = 'development' | 'test' | 'production';

export type ISODateString = string;

export type UUID = string;

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResult<TItem> = {
  items: TItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
