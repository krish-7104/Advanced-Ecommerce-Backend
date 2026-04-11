import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { emitEvent } from "../../../utils/socket.js";

export const getStatsService = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [
      registeredUsers,
      verifiedUsers,
      totalOrders,
      totalProducts,
      newUsersToday,
      newUsersYesterday,
      ordersToday,
      ordersYesterday,
      revenueTodayAgg,
      revenueYesterdayAgg,
      newStockTodayAgg,
      newStockYesterdayAgg,
      productsToday,
      productsYesterday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          emailVerified: true,
        },
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
      }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: {
            in: ["PAID", "PACKED", "SHIPPED", "DELIVERED"],
          },
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: {
            in: ["PAID", "PACKED", "SHIPPED", "DELIVERED"],
          },
          createdAt: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
      }),
      prisma.productVariant.aggregate({
        _sum: {
          stockAvailable: true,
        },
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      prisma.productVariant.aggregate({
        _sum: {
          stockAvailable: true,
        },
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
      }),
      prisma.product.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      prisma.product.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
      }),
    ]);

    const totalRevenueToday = Number(revenueTodayAgg._sum.totalAmount || 0);
    const totalRevenueYesterday = Number(
      revenueYesterdayAgg._sum.totalAmount || 0,
    );
    const totalNewStockAddedToday = newStockTodayAgg._sum.stockAvailable || 0;
    const totalNewStockAddedYesterday =
      newStockYesterdayAgg._sum.stockAvailable || 0;

    const calcPercentChange = (todayValue: number, yesterdayValue: number) => {
      if (yesterdayValue === 0) {
        if (todayValue === 0) return 0;
        return 100;
      }
      return Number(
        (((todayValue - yesterdayValue) / yesterdayValue) * 100).toFixed(2),
      );
    };

    const newUsersChangePercent = calcPercentChange(
      newUsersToday,
      newUsersYesterday,
    );
    const ordersChangePercent = calcPercentChange(ordersToday, ordersYesterday);
    const revenueChangePercent = calcPercentChange(
      totalRevenueToday,
      totalRevenueYesterday,
    );
    const stockChangePercent = calcPercentChange(
      totalNewStockAddedToday,
      totalNewStockAddedYesterday,
    );
    const productsChangePercent = calcPercentChange(
      productsToday,
      productsYesterday,
    );

    return {
      users: {
        total: registeredUsers,
        dayChange: newUsersToday - newUsersYesterday,
        dayChangePercentage: newUsersChangePercent || 0,
      },
      orders: {
        total: totalOrders,
        dayChange: ordersToday - ordersYesterday,
        dayChangePercentage: ordersChangePercent || 0,
      },
      revenue: {
        total: totalRevenueToday,
        dayChange: totalRevenueToday - totalRevenueYesterday,
        dayChangePercentage: revenueChangePercent || 0,
      },
      stockAdded: {
        total: totalNewStockAddedToday,
        dayChange: totalNewStockAddedToday - totalNewStockAddedYesterday,
        dayChangePercentage: stockChangePercent || 0,
      },
      products: {
        total: totalProducts,
        dayChange: productsToday - productsYesterday,
        dayChangePercentage: productsChangePercent || 0,
      },
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getOrderStatusGraphService = async () => {
  try {
    const grouped = await prisma.order.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    return grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getTopSellingProductsService = async (limit: number = 5) => {
  try {
    const grouped = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    });

    const variantIds = grouped.map((g) => g.variantId);

    if (!variantIds.length) {
      return [];
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },
      include: {
        product: true,
      },
    });

    const variantById = new Map(variants.map((v) => [v.id, v]));

    return grouped
      .map((g) => {
        const variant = variantById.get(g.variantId);
        if (!variant) return null;
        return {
          variantId: variant.id,
          sku: variant.sku,
          productId: variant.product.id,
          productName: variant.product.name,
          totalSold: g._sum.quantity ?? 0,
        };
      })
      .filter(Boolean);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getLowStockItemsService = async (
  threshold: number = 10,
  limit: number = 20,
) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        stockAvailable: {
          lte: threshold,
        },
        isActive: true,
      },
      include: {
        product: true,
      },
      orderBy: {
        stockAvailable: "asc",
      },
      take: limit,
    });

    return variants.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      productId: v.product.id,
      productName: v.product.name,
      stockAvailable: v.stockAvailable,
      stockSold: v.stockSold,
    }));
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getProductCountByParentCategoryService = async () => {
  try {
    const parents = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      include: {
        children: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const results = await Promise.all(
      parents.map(async (parent) => {
        const categoryIds = [parent.id, ...parent.children.map((c) => c.id)];
        const count = await prisma.product.count({
          where: {
            categoryId: {
              in: categoryIds,
            },
            isActive: true,
          },
        });

        return {
          categoryId: parent.id,
          categoryName: parent.name,
          slug: parent.slug,
          productCount: count,
        };
      }),
    );

    return results;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const emitLiveDashboardService = async (notification?: { title: string; message: string; type: 'success' | 'info' }) => {
  try {
    const [stats, orderStatus, topSelling] = await Promise.all([
      getStatsService(),
      getOrderStatusGraphService(),
      getTopSellingProductsService(5),
    ]);
    emitEvent("dashboard_update", { stats, orderStatus, topSelling });
    if (notification) {
      emitEvent("dashboard_notification", notification);
    }
  } catch (error) {
    console.error("Failed to emit live stats:", error);
  }
};

