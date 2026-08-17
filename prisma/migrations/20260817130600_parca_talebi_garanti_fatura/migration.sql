-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('PHOTO', 'INVOICE', 'OTHER');

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "type" "AttachmentType" NOT NULL DEFAULT 'PHOTO';

-- AlterTable
ALTER TABLE "stages" ADD COLUMN     "allowsPartsRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "handlesCustomerApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "purchaseDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "part_requests" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "ticketNoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_ticketNoteId_fkey" FOREIGN KEY ("ticketNoteId") REFERENCES "ticket_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
