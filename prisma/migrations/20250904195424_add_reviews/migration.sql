-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "user_agent" TEXT,
    "ip" TEXT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_created_at_idx" ON "public"."reviews"("created_at");
