CREATE TABLE "book_outbox" (
    "eventId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "bookId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "leaseUntil" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "book_outbox_pkey" PRIMARY KEY ("eventId"),
    CONSTRAINT "book_outbox_type_check" CHECK ("type" IN ('book.created', 'book.updated', 'book.deleted')),
    CONSTRAINT "book_outbox_status_check" CHECK ("status" IN ('pending', 'processing', 'published'))
);

CREATE INDEX "book_outbox_status_availableAt_createdAt_idx"
    ON "book_outbox"("status", "availableAt", "createdAt");
CREATE INDEX "book_outbox_status_leaseUntil_createdAt_idx"
    ON "book_outbox"("status", "leaseUntil", "createdAt");
CREATE INDEX "book_outbox_publishedAt_idx"
    ON "book_outbox"("publishedAt");
