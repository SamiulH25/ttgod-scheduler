import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--wall-plaster)] px-4 py-8 text-[var(--paper-ink)]">
      {children}
    </div>
  );
}
