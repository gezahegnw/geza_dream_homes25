-- AlterTable
ALTER TABLE "public"."leads" ADD COLUMN     "current_status" TEXT,
ADD COLUMN     "features" TEXT,
ADD COLUMN     "interested_location" TEXT,
ADD COLUMN     "max_sqft" TEXT,
ADD COLUMN     "min_bathrooms" TEXT,
ADD COLUMN     "min_bedrooms" TEXT,
ADD COLUMN     "min_sqft" TEXT,
ADD COLUMN     "move_in_date" TEXT,
ADD COLUMN     "property_type" TEXT;
