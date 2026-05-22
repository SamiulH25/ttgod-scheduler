import type { AppFont } from "@/lib/fonts";
import type { AppTheme } from "@/lib/themes";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      timezone: string;
      theme: AppTheme;
      font: AppFont;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
