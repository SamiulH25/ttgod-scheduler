-- Campaign lifecycle: phases, capacity, cost, proposals, votes, images

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'scheduled',
    "start" DATETIME,
    "end" DATETIME,
    "createdById" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "maxParticipants" INTEGER,
    "costTotalCents" INTEGER,
    "costCurrency" TEXT NOT NULL DEFAULT 'USD',
    "costSplitEvenly" BOOLEAN NOT NULL DEFAULT false,
    "schedulingClosedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Event" ("id", "title", "description", "phase", "start", "end", "createdById", "visibility", "maxParticipants", "costTotalCents", "costCurrency", "costSplitEvenly", "schedulingClosedAt", "createdAt", "updatedAt")
SELECT "id", "title", "description", 'scheduled', "start", "end", "createdById", "visibility", NULL, NULL, 'USD', false, NULL, "createdAt", "updatedAt" FROM "Event";

DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_createdById_start_idx" ON "Event"("createdById", "start");
CREATE INDEX "Event_phase_idx" ON "Event"("phase");

CREATE TABLE "EventTimeProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventTimeProposal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventTimeProposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventTimeProposal_eventId_idx" ON "EventTimeProposal"("eventId");

CREATE TABLE "EventProposalVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventProposalVote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "EventTimeProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EventProposalVote_eventId_userId_key" ON "EventProposalVote"("eventId", "userId");

CREATE TABLE "EventImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventImage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventImage_eventId_idx" ON "EventImage"("eventId");

PRAGMA foreign_keys=ON;
