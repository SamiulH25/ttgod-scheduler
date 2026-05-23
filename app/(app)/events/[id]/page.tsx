import { CampaignDetail, type CampaignDetailEvent } from "@/components/campaign-detail";
import { PageContainer } from "@/components/layout/page-container";
import { getEventForUser } from "@/lib/event-access";
import { serializeEventDetail } from "@/lib/serialize-event-detail";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CampaignDetailPage({ params }: Props) {
  const session = await getSession();
  const { id } = await params;
  const event = await getEventForUser(id, session!.user!.id);

  if (!event) {
    notFound();
  }

  const serialized = serializeEventDetail(event);

  return (
    <PageContainer>
      <CampaignDetail
        event={serialized as unknown as CampaignDetailEvent}
        currentUserId={session!.user!.id}
      />
    </PageContainer>
  );
}
