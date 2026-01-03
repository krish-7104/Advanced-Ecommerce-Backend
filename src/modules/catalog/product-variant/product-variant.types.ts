import { ProductVariant } from "../../../../generated/prisma/browser";

export type UpdateVariantInputTypes = {
  variantId: string;
  variantPayload: Partial<ProductVariant>;
  newImages?: Express.Multer.File[];
  deleteImageIds?: string[];
  reorderImages?: { id: string; order: number }[];
  newImageOrder?: number[];
};
