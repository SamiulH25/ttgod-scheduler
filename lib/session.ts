import { cache } from "react";
import { auth } from "@/auth";

/** One `auth()` per RSC request (dedupes root + app layout + pages). */
export const getSession = cache(async () => auth());
