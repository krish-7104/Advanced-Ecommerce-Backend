import { Prisma } from "../../../generated/prisma";
import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { GetAllAddressesQueryParams } from "./address.types";

export const getAllAddressesService = async (
  queryParams: GetAllAddressesQueryParams
) => {
  try {
    const { page, limit, search, userId, state, city, isDefault } = queryParams;

    const shouldPaginate =
      typeof page === "string" && typeof limit === "string";

    const safePage = shouldPaginate ? Math.max(Number(page), 1) : 1;
    const safeLimit = shouldPaginate ? Math.max(Number(limit), 1) : 10;

    const skip = shouldPaginate ? (safePage - 1) * safeLimit : 0;
    const take = shouldPaginate ? safeLimit : undefined;

    const where: Prisma.AddressWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (state) {
      where.state = {
        contains: state,
        mode: "insensitive",
      };
    }

    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive",
      };
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault === "true";
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          line1: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          line2: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          postalCode: {
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
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [addresses, total] = await Promise.all([
      prisma.address.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.address.count({ where }),
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
      data: addresses,
      pagination,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

