import { EventsManager } from "@/components/events-manager";

import { PageContainer } from "@/components/layout/page-container";

import { PageHeader } from "@/components/page-header";

import { loadBulletinPageData } from "@/lib/events-list-data";

import { prisma } from "@/lib/db";

import { getSession } from "@/lib/session";



export default async function EventsPage({

  searchParams,

}: {

  searchParams: Promise<{ start?: string; end?: string }>;

}) {

  const session = await getSession();

  const params = await searchParams;

  const userId = session!.user!.id;



  const [{ events, archivedEvents, users }, createdCampaignCount] =

    await Promise.all([

      loadBulletinPageData(userId),

      prisma.event.count({ where: { createdById: userId } }),

    ]);



  return (

    <PageContainer variant="wide">

      <div className="space-y-6">

        <PageHeader

          title="Campaigns"

          subtitle="Gather interest, vote on times, then pin sessions on the bulletin board."

        />

        <EventsManager

          currentUserId={userId}

          presetStart={params.start}

          presetEnd={params.end}

          showQuickTip={createdCampaignCount === 0}

          initialEvents={events}

          initialArchivedEvents={archivedEvents}

          initialUsers={users}

        />

      </div>

    </PageContainer>

  );

}

