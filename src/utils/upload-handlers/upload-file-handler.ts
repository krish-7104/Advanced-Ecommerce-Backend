import { AssetOwner } from "../../../generated/prisma/browser";
import fs from "fs";
import { prisma } from "../prisma";

export const uploadFileHandler = async (
  file: Express.Multer.File,
  ownerId: string,
  ownerType: AssetOwner,
  imageSequence: number
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
    },
  });
  return asset;
};
