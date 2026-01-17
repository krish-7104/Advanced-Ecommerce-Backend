/*
  Warnings:

  - You are about to drop the column `phoneVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerifiedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneVerified",
DROP COLUMN "phoneVerifiedAt";
