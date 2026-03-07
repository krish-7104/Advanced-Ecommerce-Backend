import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";

export const addReviewToVariantService = async (
  variantId: string,
  userId: string,
  reqBody: {
    rating: number;
    title?: string;
    comment: string;
  },
) => {
  try {
    // Check if user has purchased this variant
    const order = await prisma.order.findFirst({
      where: {
        userId: userId,
        status: "DELIVERED",
        items: {
          some: {
            variantId: variantId,
          },
        },
      },
    });

    const review = await prisma.reviews.create({
      data: {
        variantId: variantId,
        userId: userId,
        rating: reqBody.rating,
        title: reqBody.title,
        comment: reqBody.comment,
        isVerified: !!order,
      },
    });
    return review;
  } catch (err: any) {
    throw new ApiError(500, err?.message || "Error adding review");
  }
};

export const getVariantReviewsService = async (variantId: string) => {
  try {
    const reviews = await prisma.reviews.findMany({
      where: {
        variantId: variantId,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        votes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return reviews;
  } catch (err: any) {
    throw new ApiError(500, err?.message || "Error fetching reviews");
  }
};

export const getUserReviewsService = async (userId: string) => {
  try {
    const reviews = await prisma.reviews.findMany({
      where: {
        userId: userId,
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return reviews;
  } catch (err: any) {
    throw new ApiError(500, err?.message || "Error fetching user reviews");
  }
};

export const updateReviewService = async (
  reviewId: string,
  userId: string,
  reqBody: {
    rating?: number;
    title?: string;
    comment?: string;
  },
) => {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (review.userId !== userId) {
      throw new ApiError(403, "You can only update your own reviews");
    }

    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        rating: reqBody.rating,
        title: reqBody.title,
        comment: reqBody.comment,
      },
    });

    return updatedReview;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, err?.message || "Error updating review");
  }
};

export const deleteReviewService = async (reviewId: string, userId: string) => {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (review.userId !== userId) {
      throw new ApiError(403, "You can only delete your own reviews");
    }

    await prisma.reviews.delete({
      where: { id: reviewId },
    });

    return { success: true };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, err?.message || "Error deleting review");
  }
};
