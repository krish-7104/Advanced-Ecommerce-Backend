import { AssetOwner } from "../../../generated/prisma/browser";
import { prisma } from "../prisma";

export const uploadFileHandler = async (
  file: Express.Multer.File,
  ownerId: string,
  ownerType: AssetOwner,
  imageSequence: number,
  isPrimary: boolean = false
) => {
  const { filename, path, mimetype, size } = file;

  const asset = await prisma.asset.create({
    data: {
      fileName: filename,
      path,
      mimeType: mimetype,
      size: size,
      ownerId,
      assetOwner: ownerType,
      order: imageSequence,
      isPrimary: isPrimary,
    },
  });
  return asset;
};
