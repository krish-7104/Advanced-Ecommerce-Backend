export interface GetAllProductsQueryParams {
  page?: number;
  limit?: number;
  featured?: boolean | string;
  search?: string;
  categoryId?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  inStock?: boolean | string;
  sort?: string;
}
