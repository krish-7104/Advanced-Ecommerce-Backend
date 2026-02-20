/*
  Warnings:

  - The values [REVIEW_IMAGE] on the enum `AssetOwner` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reviewId` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssetOwner_new" AS ENUM ('PRODUCT_IMAGE', 'CATEGORY_IMAGE');
ALTER TABLE "Asset" ALTER COLUMN "assetOwner" TYPE "AssetOwner_new" USING ("assetOwner"::text::"AssetOwner_new");
ALTER TYPE "AssetOwner" RENAME TO "AssetOwner_old";
ALTER TYPE "AssetOwner_new" RENAME TO "AssetOwner";
DROP TYPE "public"."AssetOwner_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "reviewId";

-- DropTable
DROP TABLE "Review";
