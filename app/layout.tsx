import type { Metadata } from "next";
import { Caveat, Comic_Neue, Kalam, Patrick_Hand } from "next/font/google";
import { auth } from "@/auth";
import { FontSync } from "@/components/font-sync";
import { Providers } from "@/components/providers";
import { SvgFilters } from "@/components/svg-filters";
import { ThemeInitScript } from "@/components/theme-init-script";
import { ThemeSync } from "@/components/theme-sync";
import { resolveThemeAttribute } from "@/lib/apply-theme";
import type { AppFont } from "@/lib/fonts";
import type { AppTheme } from "@/lib/themes";
import { prisma } from "@/lib/db";
import "./globals.css";

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick",
  subsets: ["latin"],
  weight: "400",
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "TTGOD Scheduler";

export const metadata: Metadata = {
  title: appName,
  description: "Coordinate availability, plan sessions, and keep your team aligned",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let theme: AppTheme = "light";
  let font: AppFont = "caveat";

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true, font: true },
    });
    if (user?.theme) theme = user.theme as AppTheme;
    if (user?.font) font = user.font as AppFont;
  }

  const htmlTheme = resolveThemeAttribute(theme);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={htmlTheme}
      className={`${caveat.variable} ${patrickHand.variable} ${kalam.variable} ${comicNeue.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeInitScript theme={theme} />
        <SvgFilters />
        <Providers defaultTheme={theme}>
          <ThemeSync theme={theme} />
          <FontSync font={font} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
