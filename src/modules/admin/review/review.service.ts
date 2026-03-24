import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";

export const getAllReviewsAdminService = async (queryParams: {
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 10 } = queryParams;
  const skip = (page - 1) * limit;

  try {
    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          variant: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.reviews.count(),
    ]);

    const formattedReviews = reviews.map((item) => {
      return {
        ...item,
        variant: {
          ...item.variant,
          attributes:
            typeof item.variant.attributes === "string"
              ? JSON.parse(item.variant.attributes)
              : item.variant.attributes || {},
        },
      };
    });

    return {
      reviews: formattedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    throw new ApiError(500, err?.message || "Error fetching reviews");
  }
};

export const toggleReviewVisibilityService = async (reviewId: string) => {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        isVisible: !review.isVisible,
      },
    });

    return updatedReview;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, err?.message || "Error toggling review visibility");
  }
};

export const deleteReviewAdminService = async (reviewId: string) => {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(404, "Review not found");
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
