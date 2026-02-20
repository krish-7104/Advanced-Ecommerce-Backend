import { AssetOwner } from "../../../generated/prisma/browser";
import { prisma } from "../prisma";
import { uploadFileHandler } from "./upload-file-handler";

export const handleVariantImage = async (
  image: Express.Multer.File | string,
  ownerId: string,
  ownerType: AssetOwner,
  imageSequence: number,
  isPrimary: boolean = false
) => {
  if (typeof image === "string") {
    const url = image.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    const urlParts = url.split("/");
    const fileName = urlParts[urlParts.length - 1] || `image-${Date.now()}`;

    const asset = await prisma.asset.create({
      data: {
        fileName: fileName,
        path: url,
        mimeType: "image/url",
        size: 0,
        ownerId,
        assetOwner: ownerType,
        order: imageSequence,
        isPrimary: isPrimary,
      },
    });
    return asset;
  } else {
    return await uploadFileHandler(
      image,
      ownerId,
      ownerType,
      imageSequence,
      isPrimary
    );
  }
};
