"use server";

import { signOut } from "@/auth";
import { redirect } from "next/navigation";

/** Prefer client `SignOutButton` — server redirect from a form inside the app shell can error in dev. */
export async function signOutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
