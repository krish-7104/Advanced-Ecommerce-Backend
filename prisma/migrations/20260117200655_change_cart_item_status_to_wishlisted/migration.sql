-- DropTable
DROP TABLE IF EXISTS "WishlistItem";

-- Add temporary column to track SAVED_FOR_LATER items
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "_temp_was_saved" BOOLEAN DEFAULT false;
UPDATE "CartItem" SET "_temp_was_saved" = true WHERE "status" = 'SAVED_FOR_LATER';

-- Update existing SAVED_FOR_LATER to ACTIVE temporarily for enum conversion
UPDATE "CartItem" SET "status" = 'ACTIVE' WHERE "status" = 'SAVED_FOR_LATER';

-- Create new enum type
CREATE TYPE "CartItemStatus_new" AS ENUM ('ACTIVE', 'WISHLISTED');

-- Drop default constraint temporarily
ALTER TABLE "CartItem" ALTER COLUMN "status" DROP DEFAULT;

-- Alter table to use new enum
ALTER TABLE "CartItem" ALTER COLUMN "status" TYPE "CartItemStatus_new" USING ("status"::text::"CartItemStatus_new");

-- Restore default value
ALTER TABLE "CartItem" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"CartItemStatus_new";

-- Drop old enum
DROP TYPE "CartItemStatus";

-- Rename new enum to old name
ALTER TYPE "CartItemStatus_new" RENAME TO "CartItemStatus";

-- Update items that were SAVED_FOR_LATER to WISHLISTED
UPDATE "CartItem" SET "status" = 'WISHLISTED' WHERE "_temp_was_saved" = true;

-- Drop temporary column
ALTER TABLE "CartItem" DROP COLUMN IF EXISTS "_temp_was_saved";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
