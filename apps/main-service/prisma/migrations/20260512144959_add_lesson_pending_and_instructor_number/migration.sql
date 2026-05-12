/*
  Warnings:

  - A unique constraint covering the columns `[instructorNumber]` on the table `instructor_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LessonStatus" ADD VALUE 'PENDING';
ALTER TYPE "LessonStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "instructor_profiles" ADD COLUMN     "instructorNumber" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_instructorNumber_key" ON "instructor_profiles"("instructorNumber");
