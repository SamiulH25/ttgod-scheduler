import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const pendingInvites = await prisma.eventParticipant.count({
    where: { userId: session.user.id, status: "pending" },
  });

  return (
    <AppShell
      userName={session.user.name}
      userImage={session.user.image}
      pendingInvites={pendingInvites}
    >
      {children}
    </AppShell>
  );
}
