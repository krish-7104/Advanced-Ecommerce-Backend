import { AssetOwner } from "../../../generated/prisma/browser";
import { prisma } from "../prisma";

export const uploadFileHandler = async (
  file: Express.Multer.File & { filename?: string },
  ownerId: string,
  ownerType: AssetOwner,
  imageSequence: number,
  isPrimary: boolean = false
) => {
  // Cloudinary stores file info differently
  const cloudinaryFile = file as any;
  const fileName = cloudinaryFile.filename || cloudinaryFile.originalname;
  const path = cloudinaryFile.path; // This is the Cloudinary URL
  const mimetype = file.mimetype;
  const size = file.size;

  const asset = await prisma.asset.create({
    data: {
      fileName: fileName,
      path, // Cloudinary URL
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
