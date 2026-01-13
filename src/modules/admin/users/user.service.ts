import { Prisma } from "../../../generated/prisma";
import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { GetAllUsersQueryParams } from "./user.types";

export const getAllUsersService = async (
  queryParams: GetAllUsersQueryParams
) => {
  try {
    const { page, limit, search, emailVerified } = queryParams;

    const shouldPaginate =
      typeof page === "string" && typeof limit === "string";

    const safePage = shouldPaginate ? Math.max(Number(page), 1) : 1;
    const safeLimit = shouldPaginate ? Math.max(Number(limit), 1) : 10;

    const skip = shouldPaginate ? (safePage - 1) * safeLimit : 0;
    const take = shouldPaginate ? safeLimit : undefined;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phoneNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified === "true";
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          emailVerified: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              addresses: true,
              orders: true,
              cartItems: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = shouldPaginate
      ? {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        }
      : undefined;

    return {
      data: users,
      pagination,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
