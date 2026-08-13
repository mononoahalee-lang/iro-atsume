-- CreateTable
CREATE TABLE "CollectedColor" (
    "id" TEXT NOT NULL,
    "sampledHex" TEXT NOT NULL,
    "matchedName" TEXT NOT NULL,
    "matchedReading" TEXT NOT NULL,
    "matchedHex" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectedColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectedColor_capturedAt_idx" ON "CollectedColor"("capturedAt" DESC);

-- CreateIndex
CREATE INDEX "CollectedColor_matchedName_idx" ON "CollectedColor"("matchedName");
