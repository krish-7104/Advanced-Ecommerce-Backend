/*
  Warnings:

  - You are about to drop the column `token` on the `AdminUserToken` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `AdminUserToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `AdminUserToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AdminUserToken_token_key";

-- AlterTable
ALTER TABLE "AdminUserToken" DROP COLUMN "token",
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "images";

-- CreateIndex
CREATE UNIQUE INDEX "AdminUserToken_tokenHash_key" ON "AdminUserToken"("tokenHash");
