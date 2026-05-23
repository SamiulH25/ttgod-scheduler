-- EventExpense spreadsheet; migrate legacy costTotalCents

PRAGMA foreign_keys=OFF;

CREATE TABLE "EventExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventExpense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "EventExpense_eventId_sortOrder_idx" ON "EventExpense"("eventId", "sortOrder");

INSERT INTO "EventExpense" ("id", "eventId", "label", "amountCents", "sortOrder", "createdById", "createdAt")
SELECT
    'legacy-' || "id",
    "id",
    'Legacy total',
    "costTotalCents",
    0,
    "createdById",
    CURRENT_TIMESTAMP
FROM "Event"
WHERE "costTotalCents" IS NOT NULL AND "costTotalCents" > 0;

CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'interest',
    "start" DATETIME,
    "end" DATETIME,
    "createdById" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "maxParticipants" INTEGER,
    "costCurrency" TEXT NOT NULL DEFAULT 'USD',
    "costSplitEvenly" BOOLEAN NOT NULL DEFAULT false,
    "schedulingClosedAt" DATETIME,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Event" ("id", "title", "description", "phase", "start", "end", "createdById", "visibility", "maxParticipants", "costCurrency", "costSplitEvenly", "schedulingClosedAt", "archivedAt", "createdAt", "updatedAt")
SELECT "id", "title", "description", "phase", "start", "end", "createdById", "visibility", "maxParticipants", "costCurrency", "costSplitEvenly", "schedulingClosedAt", "archivedAt", "createdAt", "updatedAt" FROM "Event";

DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_createdById_start_idx" ON "Event"("createdById", "start");
CREATE INDEX "Event_phase_idx" ON "Event"("phase");
CREATE INDEX "Event_archivedAt_idx" ON "Event"("archivedAt");

PRAGMA foreign_keys=ON;
