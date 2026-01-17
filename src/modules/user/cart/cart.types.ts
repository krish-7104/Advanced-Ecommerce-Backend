export interface AddToCartPayload {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity?: number;
  status?: "ACTIVE" | "WISHLISTED";
}
