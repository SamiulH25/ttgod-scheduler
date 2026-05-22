"use client";

import { signOutAction } from "@/app/actions/auth";
import { FadeIn } from "@/components/motion/fade-in";
import { NavIndicator } from "@/components/motion/nav-indicator";
import { FontPicker } from "@/components/settings/font-picker";
import { ThemePicker } from "@/components/settings/theme-picker";
import { UserAvatar } from "@/components/user-avatar";
import { applyThemeToDocument } from "@/lib/apply-theme";
import { fontFamilyFor, type AppFont } from "@/lib/fonts";
import { type AppTheme } from "@/lib/themes";
import { tiltFromId } from "@/lib/paper-tilt";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const TABS = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "regional", label: "Regional" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type SettingsFormProps = {
  initialTimezone: string;
  initialTheme: string;
  initialFont: string;
  userName: string | null;
  userImage: string | null;
};

export function SettingsForm({
  initialTimezone,
  initialTheme,
  initialFont,
  userName,
  userImage,
}: SettingsFormProps) {
  const { setTheme } = useTheme();
  const { update: updateSession } = useSession();
  const [timezone, setTimezone] = useState(initialTimezone);
  const [theme, setThemeValue] = useState(initialTheme as AppTheme);
  const [font, setFont] = useState(initialFont as AppFont);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabId>("appearance");

  const isDirty = useMemo(
    () =>
      timezone !== initialTimezone ||
      theme !== initialTheme ||
      font !== initialFont,
    [timezone, theme, font, initialTimezone, initialTheme, initialFont],
  );

  function applyFontPreview(next: AppFont) {
    const family = fontFamilyFor(next);
    document.documentElement.style.setProperty("--font-sans-family", family);
    document.documentElement.style.setProperty("--font-display-family", family);
  }

  function handleThemeChange(next: AppTheme) {
    setThemeValue(next);
    setTheme(next);
    applyThemeToDocument(next);
  }

  function handleFontChange(next: AppFont) {
    setFont(next);
    applyFontPreview(next);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, theme, font }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save settings");
      return;
    }
    setTheme(theme);
    applyThemeToDocument(theme);
    applyFontPreview(font);
    await updateSession();
    toast.success("Preferences saved");
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <nav className="flex gap-2 overflow-x-auto lg:w-48 lg:flex-col lg:gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "paper-sheet relative shrink-0 px-4 py-2.5 font-display text-lg font-bold transition-all duration-fast lg:w-full lg:text-left",
                active
                  ? "text-[var(--paper-ink)]"
                  : "text-[var(--paper-ink-muted)] hover:text-[var(--paper-ink)]",
              )}
              style={
                { "--paper-tilt": `${tiltFromId(t.id, 1.2)}deg` } as React.CSSProperties
              }
            >
              {active && <NavIndicator layoutId="settings-tab" />}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 space-y-6">
        <FadeIn key={tab}>
          {tab === "account" && (
            <Card tiltId={`settings-${tab}`} tape>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Your Discord identity on the squad board
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <UserAvatar name={userName} image={userImage} size="lg" />
                <div>
                  <p className="font-display text-xl font-bold">
                    {userName ?? "Discord user"}
                  </p>
                  <form className="mt-3" action={signOutAction}>
                    <Button variant="outline" size="sm" type="submit">
                      Sign out
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "appearance" && (
            <div className="space-y-6">
              <Card tiltId="settings-theme-card" tape>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>
                    Plaster wall, paper, and crayon colors — classic modes plus
                    squad palettes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemePicker value={theme} onChange={handleThemeChange} />
                </CardContent>
              </Card>
              <Card tiltId="settings-font-card" tape>
                <CardHeader>
                  <CardTitle>Font</CardTitle>
                  <CardDescription>
                    One handwriting style across the whole app
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FontPicker value={font} onChange={handleFontChange} />
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "regional" && (
            <Card tiltId={`settings-${tab}`} tape>
              <CardHeader>
                <CardTitle>Regional</CardTitle>
                <CardDescription>
                  Times on the calendar and event stickies use this zone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </FadeIn>

        <div className="paper-sheet sticky bottom-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-[var(--paper-ink-muted)]">
            {isDirty
              ? "You have unsaved changes"
              : "All preferences match your saved profile"}
          </p>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="min-w-[140px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save settings"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
