-- AlterTable
ALTER TABLE "EventPlanItem" ADD COLUMN "checklist" TEXT;
ALTER TABLE "EventPlanItem" ADD COLUMN "url" TEXT;

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordGuildId" TEXT,
    "name" TEXT NOT NULL,
    "joinCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GuildMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuildMember_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GuildMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SquadGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SquadGroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SquadGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SquadGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SquadGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 120,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "maxParticipants" INTEGER,
    "costSplitEvenly" BOOLEAN NOT NULL DEFAULT false,
    "defaultPhase" TEXT NOT NULL DEFAULT 'interest',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AvailabilityBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'free',
    "recurrenceRule" TEXT,
    "seriesId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilityBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AvailabilityBlock" ("createdAt", "end", "id", "label", "recurrenceRule", "start", "userId") SELECT "createdAt", "end", "id", "label", "recurrenceRule", "start", "userId" FROM "AvailabilityBlock";
DROP TABLE "AvailabilityBlock";
ALTER TABLE "new_AvailabilityBlock" RENAME TO "AvailabilityBlock";
CREATE INDEX "AvailabilityBlock_userId_start_idx" ON "AvailabilityBlock"("userId", "start");
CREATE INDEX "AvailabilityBlock_seriesId_idx" ON "AvailabilityBlock"("seriesId");
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'interest',
    "start" DATETIME,
    "end" DATETIME,
    "createdById" TEXT NOT NULL,
    "guildId" TEXT,
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
    CONSTRAINT "Event_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CampaignTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("archivedAt", "costCurrency", "costSplitEvenly", "createdAt", "createdById", "description", "end", "id", "maxParticipants", "phase", "schedulingClosedAt", "start", "title", "updatedAt", "visibility") SELECT "archivedAt", "costCurrency", "costSplitEvenly", "createdAt", "createdById", "description", "end", "id", "maxParticipants", "phase", "schedulingClosedAt", "start", "title", "updatedAt", "visibility" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_createdById_start_idx" ON "Event"("createdById", "start");
CREATE INDEX "Event_phase_idx" ON "Event"("phase");
CREATE INDEX "Event_archivedAt_idx" ON "Event"("archivedAt");
CREATE INDEX "Event_guildId_idx" ON "Event"("guildId");
CREATE TABLE "new_EventParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "guestEmail" TEXT,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "waitlistPosition" INTEGER,
    CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventParticipant" ("eventId", "id", "status", "userId") SELECT "eventId", "id", "status", "userId" FROM "EventParticipant";
DROP TABLE "EventParticipant";
ALTER TABLE "new_EventParticipant" RENAME TO "EventParticipant";
CREATE INDEX "EventParticipant_eventId_status_idx" ON "EventParticipant"("eventId", "status");
CREATE UNIQUE INDEX "EventParticipant_eventId_userId_key" ON "EventParticipant"("eventId", "userId");
CREATE TABLE "new_EventProposalVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventProposalVote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "EventTimeProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventProposalVote" ("createdAt", "eventId", "id", "proposalId", "updatedAt", "userId") SELECT "createdAt", "eventId", "id", "proposalId", "updatedAt", "userId" FROM "EventProposalVote";
DROP TABLE "EventProposalVote";
ALTER TABLE "new_EventProposalVote" RENAME TO "EventProposalVote";
CREATE UNIQUE INDEX "EventProposalVote_eventId_userId_proposalId_key" ON "EventProposalVote"("eventId", "userId", "proposalId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "font" TEXT NOT NULL DEFAULT 'caveat',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "calendarToken" TEXT,
    "notificationPrefs" TEXT,
    "lastGuildId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "discordId", "email", "emailVerified", "font", "id", "image", "name", "onboardingCompleted", "theme", "timezone", "updatedAt") SELECT "createdAt", "discordId", "email", "emailVerified", "font", "id", "image", "name", "onboardingCompleted", "theme", "timezone", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_calendarToken_key" ON "User"("calendarToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Guild_discordGuildId_key" ON "Guild"("discordGuildId");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_joinCode_key" ON "Guild"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "GuildMember_guildId_userId_key" ON "GuildMember"("guildId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadGroupMember_groupId_userId_key" ON "SquadGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");
