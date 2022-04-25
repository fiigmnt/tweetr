-- AlterTable
ALTER TABLE "User" ALTER COLUMN "followed" DROP NOT NULL,
ALTER COLUMN "followed" SET DEFAULT false;
