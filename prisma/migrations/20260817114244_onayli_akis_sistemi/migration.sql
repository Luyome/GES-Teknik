-- CreateEnum
CREATE TYPE "TicketNoteType" AS ENUM ('ASSIGNED', 'ACCEPTED', 'PARTS_ISSUE', 'CUSTOMER_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'ASSIGNED';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "estimatedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "isUnderWarranty" BOOLEAN,
ADD COLUMN     "serialNumber" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ASSIGNED';

-- CreateTable
CREATE TABLE "ticket_notes" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "stageId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "TicketNoteType" NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
