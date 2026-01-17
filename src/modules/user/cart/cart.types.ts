export interface AddToCartPayload {
  variantId: string;
  quantity: number;
}

export interface AddToWishlistPayload {
  variantId: string;
}

export interface UpdateCartItemPayload {
  quantity?: number;
  status?: "ACTIVE" | "WISHLISTED";
}
