/*
  Warnings:

  - You are about to drop the column `departmentId` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `action` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AdminUser" DROP CONSTRAINT "AdminUser_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "AdminUser" DROP CONSTRAINT "AdminUser_roleId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- AlterTable
ALTER TABLE "AdminUser" DROP COLUMN "departmentId",
DROP COLUMN "roleId";

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "resource" TEXT NOT NULL;

-- DropTable
DROP TABLE "Department";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "RolePermission";

-- CreateTable
CREATE TABLE "_AdminUserToPermission" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AdminUserToPermission_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AdminUserToPermission_B_index" ON "_AdminUserToPermission"("B");

-- AddForeignKey
ALTER TABLE "_AdminUserToPermission" ADD CONSTRAINT "_AdminUserToPermission_A_fkey" FOREIGN KEY ("A") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminUserToPermission" ADD CONSTRAINT "_AdminUserToPermission_B_fkey" FOREIGN KEY ("B") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
