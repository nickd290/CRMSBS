-- CreateTable
CREATE TABLE IF NOT EXISTS "gmail_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "email_messages" (
    "id" TEXT NOT NULL,
    "gmailAccountId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "snippet" TEXT,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "email_customer_links" (
    "id" TEXT NOT NULL,
    "emailMessageId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_customer_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "stockLevel" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "jobNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerPO" TEXT,
    "status" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "mockups" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT,
    "status" TEXT NOT NULL,
    "ziflowUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "mockups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "samples" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trackingNo" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedAt" TIMESTAMP(3),

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "gmail_accounts_email_key" ON "gmail_accounts"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_messages_gmailAccountId_date_idx" ON "email_messages"("gmailAccountId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_messages_threadId_idx" ON "email_messages"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_messages_gmailAccountId_messageId_key" ON "email_messages"("gmailAccountId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_customer_links_emailMessageId_customerId_key" ON "email_customer_links"("emailMessageId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orders_jobNo_key" ON "orders"("jobNo");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNo_key" ON "invoices"("invoiceNo");

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_messages_gmailAccountId_fkey') THEN
   ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_gmailAccountId_fkey" FOREIGN KEY ("gmailAccountId") REFERENCES "gmail_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_customer_links_emailMessageId_fkey') THEN
   ALTER TABLE "email_customer_links" ADD CONSTRAINT "email_customer_links_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_customer_links_customerId_fkey') THEN
   ALTER TABLE "email_customer_links" ADD CONSTRAINT "email_customer_links_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_customerId_fkey') THEN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_orderId_fkey') THEN
   ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_productId_fkey') THEN
   ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_customerId_fkey') THEN
   ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_orderId_fkey') THEN
   ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mockups_customerId_fkey') THEN
   ALTER TABLE "mockups" ADD CONSTRAINT "mockups_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
 END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'samples_customerId_fkey') THEN
   ALTER TABLE "samples" ADD CONSTRAINT "samples_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
 END IF;
END $$;

-- Create the Prisma migrations table
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Record this migration
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, started_at, applied_steps_count)
VALUES (
    '20251123233013-init',
    '20251123233013_init',
    '20251123233013_init',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
) ON CONFLICT DO NOTHING;
