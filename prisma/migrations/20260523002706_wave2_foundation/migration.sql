-- AlterTable
ALTER TABLE "AvailabilityBlock" ADD COLUMN "lfgNote" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "awayUntil" DATETIME;
ALTER TABLE "User" ADD COLUMN "energyPreference" TEXT;
ALTER TABLE "User" ADD COLUMN "quietHours" TEXT;

-- CreateTable
CREATE TABLE "SoftHold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "convertedEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SoftHold_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoftHold_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#c4a574',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Season_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WallNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WallNote_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WallNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicShareToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "guildId" TEXT,
    "eventId" TEXT,
    "createdById" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicShareToken_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventOption_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventOptionVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventOptionVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "EventOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventOptionVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxCount" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EventRole_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'interest',
    "start" DATETIME,
    "end" DATETIME,
    "createdById" TEXT NOT NULL,
    "guildId" TEXT,
    "seasonId" TEXT,
    "templateId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "maxParticipants" INTEGER,
    "costCurrency" TEXT NOT NULL DEFAULT 'USD',
    "costSplitEvenly" BOOLEAN NOT NULL DEFAULT false,
    "schedulingClosedAt" DATETIME,
    "archivedAt" DATETIME,
    "recapNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CampaignTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("archivedAt", "costCurrency", "costSplitEvenly", "createdAt", "createdById", "description", "end", "guildId", "id", "maxParticipants", "phase", "recapNote", "schedulingClosedAt", "start", "templateId", "title", "updatedAt", "visibility") SELECT "archivedAt", "costCurrency", "costSplitEvenly", "createdAt", "createdById", "description", "end", "guildId", "id", "maxParticipants", "phase", "recapNote", "schedulingClosedAt", "start", "templateId", "title", "updatedAt", "visibility" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_createdById_start_idx" ON "Event"("createdById", "start");
CREATE INDEX "Event_phase_idx" ON "Event"("phase");
CREATE INDEX "Event_archivedAt_idx" ON "Event"("archivedAt");
CREATE INDEX "Event_guildId_idx" ON "Event"("guildId");
CREATE INDEX "Event_seasonId_idx" ON "Event"("seasonId");
CREATE TABLE "new_EventExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "paidById" TEXT,
    "splits" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventExpense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EventExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventExpense" ("amountCents", "createdAt", "createdById", "eventId", "id", "label", "sortOrder") SELECT "amountCents", "createdAt", "createdById", "eventId", "id", "label", "sortOrder" FROM "EventExpense";
DROP TABLE "EventExpense";
ALTER TABLE "new_EventExpense" RENAME TO "EventExpense";
CREATE INDEX "EventExpense_eventId_sortOrder_idx" ON "EventExpense"("eventId", "sortOrder");
CREATE TABLE "new_EventParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    "guestEmail" TEXT,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "waitlistPosition" INTEGER,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventParticipant_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "EventRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventParticipant" ("displayName", "eventId", "guestEmail", "id", "status", "userId", "waitlistPosition") SELECT "displayName", "eventId", "guestEmail", "id", "status", "userId", "waitlistPosition" FROM "EventParticipant";
DROP TABLE "EventParticipant";
ALTER TABLE "new_EventParticipant" RENAME TO "EventParticipant";
CREATE INDEX "EventParticipant_eventId_status_idx" ON "EventParticipant"("eventId", "status");
CREATE UNIQUE INDEX "EventParticipant_eventId_userId_key" ON "EventParticipant"("eventId", "userId");
CREATE TABLE "new_EventPlanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'step',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" DATETIME,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "url" TEXT,
    "location" TEXT,
    "checklist" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventPlanItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventPlanItem" ("checklist", "createdAt", "eventId", "id", "notes", "sortOrder", "startsAt", "title", "url") SELECT "checklist", "createdAt", "eventId", "id", "notes", "sortOrder", "startsAt", "title", "url" FROM "EventPlanItem";
DROP TABLE "EventPlanItem";
ALTER TABLE "new_EventPlanItem" RENAME TO "EventPlanItem";
CREATE INDEX "EventPlanItem_eventId_sortOrder_idx" ON "EventPlanItem"("eventId", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SoftHold_convertedEventId_key" ON "SoftHold"("convertedEventId");

-- CreateIndex
CREATE INDEX "SoftHold_guildId_expiresAt_idx" ON "SoftHold"("guildId", "expiresAt");

-- CreateIndex
CREATE INDEX "Season_guildId_sortOrder_idx" ON "Season"("guildId", "sortOrder");

-- CreateIndex
CREATE INDEX "WallNote_guildId_expiresAt_idx" ON "WallNote"("guildId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicShareToken_token_key" ON "PublicShareToken"("token");

-- CreateIndex
CREATE INDEX "PublicShareToken_type_token_idx" ON "PublicShareToken"("type", "token");

-- CreateIndex
CREATE INDEX "EventOption_eventId_sortOrder_idx" ON "EventOption"("eventId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EventOptionVote_eventId_userId_key" ON "EventOptionVote"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventRole_eventId_idx" ON "EventRole"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendance_eventId_userId_key" ON "EventAttendance"("eventId", "userId");
