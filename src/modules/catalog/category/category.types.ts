export interface GetAllCategoriesQueryParams {
  parentId?: string;
  products?: boolean | string;
  productCount?: boolean | string;
  children?: boolean | string;
  childrenCount?: boolean | string;
  parent?: boolean | string;
  level?: number | string;
  onlyParent?: boolean | string;
}
