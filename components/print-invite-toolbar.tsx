"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PrintInviteToolbar({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-4 print:hidden">
      <Button variant="outline" asChild>
        <Link href={`/events/${eventId}`}>← Back to campaign</Link>
      </Button>
      <Button type="button" variant="default" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}
