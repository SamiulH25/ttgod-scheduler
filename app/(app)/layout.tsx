import { AppDataProvider } from "@/components/app-data-provider";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  const pendingInvites = await prisma.eventParticipant.count({
    where: { userId: session.user.id, status: "pending" },
  });

  return (
    <AppDataProvider pendingInvites={pendingInvites}>
      <AppShell
        userName={session.user.name}
        userImage={session.user.image}
        pendingInvites={pendingInvites}
      >
        {children}
      </AppShell>
    </AppDataProvider>
  );
}
