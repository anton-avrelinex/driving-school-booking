ALTER TABLE "school_configs" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "student_profiles" ADD COLUMN "outstandingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0;
