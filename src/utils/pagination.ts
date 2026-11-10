export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});
