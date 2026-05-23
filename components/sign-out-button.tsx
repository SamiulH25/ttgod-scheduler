"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type SignOutButtonProps = {
  callbackUrl?: string;
} & Pick<ComponentProps<typeof Button>, "variant" | "size" | "className">;

export function SignOutButton({
  callbackUrl = "/",
  variant = "outline",
  size = "sm",
  className,
}: SignOutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut({ callbackUrl, redirect: true });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() => void handleSignOut()}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
