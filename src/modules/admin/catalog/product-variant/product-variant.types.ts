import { ProductVariant } from "../../../../../generated/prisma/browser";

export interface UpdateVariantInputTypes {
  variantId: string;
  variantPayload: Partial<ProductVariant>;
  newImages: (Express.Multer.File | string)[];
  deleteImageIds: string[];
  reorderImages: { id: string; order: number }[];
  newImageOrder: number[];
  coverImageIndex: number;
  coverImageId?: string;
}
