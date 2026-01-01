import { ProductVariantModel } from "../../../../generated/prisma/models";
import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";

export const createProductVariantService = async (
  payload: ProductVariantModel,
  productId: string
) => {
  try {
    const {
      sku,
      images,
      mrp,
      attributes,
      isActive,
      price,
      stockAvailable,
      isDefault,
    } = payload;

    if (sku) {
      const checkSKU = await prisma.productVariant.findFirst({
        where: {
          sku: sku,
        },
      });

      if (checkSKU) {
        throw new ApiError(
          400,
          "SKU with this Product Variant already exists!"
        );
      }
    }

    const productFoundCheck = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!productFoundCheck) {
      throw new ApiError(404, "Product not found!");
    }

    const Product = await prisma.productVariant.create({
      data: {
        sku,
        attributes: attributes || {},
        price,
        mrp,
        productId,
        isActive,
        stockAvailable,
        images,
        isDefault,
      },
    });
    return Product;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllProductVariantsService = async (productId: string) => {
  try {
    const productVariants = await prisma.productVariant.findMany({
      where: {
        productId: productId,
      },
      include: {
        product: {
          include: {
            category: {
              include: {
                children: true,
              },
            },
          },
          omit: {
            attributesSchema: true,
          },
        },
        _count: {
          select: {
            cartItems: true,
            orderItems: true,
          },
        },
      },
    });

    return productVariants;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getProductVariantByIdService = async (id: string) => {
  try {
    const variantFoundCheck = await prisma.productVariant.findUnique({
      where: {
        id: id,
      },
    });

    if (!variantFoundCheck) {
      throw new ApiError(404, "Product Variant not found!");
    }

    const productVariant = await prisma.productVariant.findUnique({
      where: { id: id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return productVariant;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

// export const updateProductVariantService = async (
//   id: string,
//   payload: ProductVariantModel
// ) => {
//   try {
//     const Product = await prisma.product.update({
//       where: { id },
//       data: { ...payload, attributesSchema: payload.attributesSchema || {} },
//     });
//     return Product;
//   } catch (error: any) {
//     if (error instanceof ApiError) throw error;
//     throw new ApiError(500, error?.message || "Something Went Wrong");
//   }
// };

// export const deleteProductVariantService = async (id: string) => {
//   try {
//     const Product = await prisma.product.findUnique({
//       where: { id },
//     });

//     if (!Product) {
//       throw new ApiError(404, "Product not found!");
//     }

//     const result = await prisma.product.delete({
//       where: { id },
//     });

//     return result;
//   } catch (error: any) {
//     if (error instanceof ApiError) throw error;
//     throw new ApiError(500, error?.message || "Something Went Wrong");
//   }
// };
