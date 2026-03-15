/*
  Warnings:

  - You are about to drop the column `createdAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `categories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_schoolId_fkey";

-- DropIndex
DROP INDEX "categories_schoolId_idx";

-- DropIndex
DROP INDEX "categories_schoolId_name_key";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "createdAt",
DROP COLUMN "schoolId",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "_CategoryToSchool" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToSchool_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToSchool_B_index" ON "_CategoryToSchool"("B");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- AddForeignKey
ALTER TABLE "_CategoryToSchool" ADD CONSTRAINT "_CategoryToSchool_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToSchool" ADD CONSTRAINT "_CategoryToSchool_B_fkey" FOREIGN KEY ("B") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
