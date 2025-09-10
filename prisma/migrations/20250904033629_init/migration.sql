-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "intent" TEXT,
    "timeframe" TEXT,
    "budget" TEXT,
    "message" TEXT,
    "user_agent" TEXT,
    "ip" TEXT,
    "source" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "referrer" TEXT,
    "landing_page" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "public"."leads"("email");
