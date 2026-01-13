import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { CreateAddressPayload, UpdateAddressPayload } from "./address.types";

export const getAllAddressesService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return addresses;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const createAddressService = async (
  payload: CreateAddressPayload,
  userId: string
) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const existingAddress = await prisma.address.findFirst({
      where: {
        name: payload.name.trim(),
        userId,
      },
    });

    if (existingAddress) {
      throw new ApiError(400, "Address with this name already exists");
    }

    const {
      name,
      phoneNumber,
      line1,
      line2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = payload;

    if (!name || !name.trim()) {
      throw new ApiError(400, "Name is required");
    }

    if (!line1 || !line1.trim()) {
      throw new ApiError(400, "Address line 1 is required");
    }

    if (!city || !city.trim()) {
      throw new ApiError(400, "City is required");
    }

    if (!state || !state.trim()) {
      throw new ApiError(400, "State is required");
    }

    if (!postalCode || !postalCode.trim()) {
      throw new ApiError(400, "Postal code is required");
    }

    const prismaTx = prisma.$transaction.bind(prisma);
    const result = await prismaTx(async (tx) => {
      if (isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const address = await tx.address.create({
        data: {
          userId,
          name: name.trim(),
          phoneNumber: phoneNumber?.trim() || null,
          line1: line1.trim(),
          line2: line2?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country?.trim() || "India",
          isDefault: isDefault === true,
        },
      });

      return address;
    });

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateAddressService = async (
  addressId: string,
  payload: UpdateAddressPayload,
  userId: string
) => {
  try {
    if (!addressId) {
      throw new ApiError(400, "Address ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Address not found");
    }

    if (existingAddress.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to update this address"
      );
    }

    const updateData: any = {};

    if (payload.name !== undefined) {
      if (!payload.name || !payload.name.trim()) {
        throw new ApiError(400, "Name cannot be empty");
      }
      updateData.name = payload.name.trim();
    }

    if (payload.phoneNumber !== undefined) {
      updateData.phoneNumber = payload.phoneNumber?.trim() || null;
    }

    if (payload.line1 !== undefined) {
      if (!payload.line1 || !payload.line1.trim()) {
        throw new ApiError(400, "Address line 1 cannot be empty");
      }
      updateData.line1 = payload.line1.trim();
    }

    if (payload.line2 !== undefined) {
      updateData.line2 = payload.line2?.trim() || null;
    }

    if (payload.city !== undefined) {
      if (!payload.city || !payload.city.trim()) {
        throw new ApiError(400, "City cannot be empty");
      }
      updateData.city = payload.city.trim();
    }

    if (payload.state !== undefined) {
      if (!payload.state || !payload.state.trim()) {
        throw new ApiError(400, "State cannot be empty");
      }
      updateData.state = payload.state.trim();
    }

    if (payload.postalCode !== undefined) {
      if (!payload.postalCode || !payload.postalCode.trim()) {
        throw new ApiError(400, "Postal code cannot be empty");
      }
      updateData.postalCode = payload.postalCode.trim();
    }

    if (payload.country !== undefined) {
      updateData.country = payload.country?.trim() || "India";
    }

    const prismaTx = prisma.$transaction.bind(prisma);
    const result = await prismaTx(async (tx) => {
      if (payload.isDefault === true && !existingAddress.isDefault) {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
        updateData.isDefault = true;
      } else if (payload.isDefault === false) {
        updateData.isDefault = false;
      }

      const address = await tx.address.update({
        where: { id: addressId },
        data: updateData,
      });

      return address;
    });

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const deleteAddressService = async (
  addressId: string,
  userId: string
) => {
  try {
    if (!addressId) {
      throw new ApiError(400, "Address ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    if (address.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to delete this address"
      );
    }

    const orderCount = await prisma.order.count({
      where: {
        addressId,
      },
    });

    if (orderCount > 0) {
      throw new ApiError(
        400,
        "Cannot delete address that has been used in orders"
      );
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return { message: "Address deleted successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const setDefaultAddressService = async (
  addressId: string,
  userId: string
) => {
  try {
    if (!addressId) {
      throw new ApiError(400, "Address ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    if (address.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to modify this address"
      );
    }

    const prismaTx = prisma.$transaction.bind(prisma);
    const result = await prismaTx(async (tx) => {
      await tx.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      const updatedAddress = await tx.address.update({
        where: { id: addressId },
        data: {
          isDefault: true,
        },
      });

      return updatedAddress;
    });

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
