-- CreateEnum
CREATE TYPE "AssetOwner" AS ENUM ('PRODUCT_IMAGE');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "assetOwner" "AssetOwner" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_fileName_key" ON "Asset"("fileName");

-- CreateIndex
CREATE INDEX "Asset_fileName_idx" ON "Asset"("fileName");
