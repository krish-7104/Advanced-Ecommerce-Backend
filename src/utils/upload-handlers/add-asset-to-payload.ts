import { AssetOwner } from "../../../generated/prisma/browser";
import { prisma } from "../prisma";

export const addAssetToPayload = async (
  ownerId: string,
  ownerType: AssetOwner,
  onlyPrimary: boolean = false,
) => {
  let whereCondition = {};
  if (onlyPrimary) {
    whereCondition = {
      isPrimary: true,
    };
  }

  const assets = await prisma.asset.findMany({
    where: {
      ...whereCondition,
      ownerId,
      assetOwner: ownerType,
    },
    orderBy: {
      order: "asc",
    },
  });

  const assetsPayload: any = {
    images: assets.map((asset: any) => {
      return {
        id: asset.id,
        fileName: asset.fileName,
        isPrimary: asset.isPrimary,
        url: asset.path,
      };
    }),
  };

  return assetsPayload;
};
