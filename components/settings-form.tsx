"use client";

import { FadeIn } from "@/components/motion/fade-in";
import { SignOutButton } from "@/components/sign-out-button";
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
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
  { id: "rhythm", label: "Rhythm" },
  { id: "sync", label: "Calendar & alerts" },
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
  const [calendarUrl, setCalendarUrl] = useState("");
  const [publicWeekUrl, setPublicWeekUrl] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState("");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [baselineNotif, setBaselineNotif] = useState<string | null>(null);
  const [awayUntil, setAwayUntil] = useState("");
  const [quietHours, setQuietHours] = useState("");
  const [energyPreference, setEnergyPreference] = useState("flex");
  const [baselineRhythm, setBaselineRhythm] = useState<{
    awayUntil: string;
    quietHours: string;
    energy: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) {
          setCalendarUrl(d.calendarSubscribeUrl ?? "");
          setNotificationPrefs(d.notificationPrefs ?? "");
          setBaselineNotif(d.notificationPrefs ?? "");
          setAwayUntil(
            d.awayUntil
              ? new Date(d.awayUntil).toISOString().slice(0, 16)
              : "",
          );
          setQuietHours(d.quietHours ?? "");
          setEnergyPreference(d.energyPreference ?? "flex");
          setBaselineRhythm({
            awayUntil: d.awayUntil
              ? new Date(d.awayUntil).toISOString().slice(0, 16)
              : "",
            quietHours: d.quietHours ?? "",
            energy: d.energyPreference ?? "flex",
          });
          setPrefsLoaded(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(() => {
    const rhythmDirty =
      baselineRhythm != null &&
      (awayUntil !== baselineRhythm.awayUntil ||
        quietHours !== baselineRhythm.quietHours ||
        energyPreference !== baselineRhythm.energy);
    return (
      timezone !== initialTimezone ||
      theme !== initialTheme ||
      font !== initialFont ||
      (baselineNotif !== null && notificationPrefs !== baselineNotif) ||
      rhythmDirty
    );
  }, [
    timezone,
    theme,
    font,
    initialTimezone,
    initialTheme,
    initialFont,
    baselineNotif,
    notificationPrefs,
    baselineRhythm,
    awayUntil,
    quietHours,
    energyPreference,
  ]);

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
      body: JSON.stringify({
        timezone,
        theme,
        font,
        ...(prefsLoaded
          ? {
              notificationPrefs: notificationPrefs || null,
              awayUntil: awayUntil
                ? new Date(awayUntil).toISOString()
                : null,
              quietHours: quietHours.trim() || null,
              energyPreference: energyPreference || null,
            }
          : {}),
      }),
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
    setBaselineNotif(notificationPrefs);
    setBaselineRhythm({
      awayUntil,
      quietHours,
      energy: energyPreference,
    });
  }

  async function rotateCalendarToken() {
    setSaving(true);
    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rotateCalendarToken: true }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not rotate token");
      return;
    }
    const data = await res.json();
    setCalendarUrl(data.calendarSubscribeUrl ?? "");
    toast.success("New calendar link generated");
  }

  async function mintPublicWeekLink() {
    setSaving(true);
    const res = await fetch("/api/public-share/week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not create public week link");
      return;
    }
    const data = (await res.json()) as { url?: string };
    if (data.url && typeof window !== "undefined") {
      setPublicWeekUrl(`${window.location.origin}${data.url}`);
    }
    toast.success("Public week link created — copy and share");
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
                  Name and avatar sync from Discord each time you sign in
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <UserAvatar name={userName} image={userImage} size="lg" />
                <div>
                  <p className="font-display text-xl font-bold">
                    {userName ?? "Discord user"}
                  </p>
                  <div className="mt-3">
                    <SignOutButton />
                  </div>
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

          {tab === "rhythm" && (
            <Card tiltId="settings-rhythm" tape>
              <CardHeader>
                <CardTitle>Rhythm & boundaries</CardTitle>
                <CardDescription>
                  Vacation mode, quiet hours (stored as JSON text), and when you
                  prefer to play.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="away-until">Away until (optional)</Label>
                  <Input
                    id="away-until"
                    type="datetime-local"
                    value={awayUntil}
                    onChange={(e) => setAwayUntil(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    While away, you won&apos;t count toward squad overlap pings.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-hours">Quiet hours JSON</Label>
                  <textarea
                    id="quiet-hours"
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                    value={quietHours}
                    onChange={(e) => setQuietHours(e.target.value)}
                    placeholder='{"start":"22:00","end":"08:00"}'
                  />
                </div>
                <div className="space-y-2">
                  <Label>Energy preference</Label>
                  <Select
                    value={energyPreference}
                    onValueChange={setEnergyPreference}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="night">Night owl</SelectItem>
                      <SelectItem value="flex">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "sync" && (
            <Card tiltId="settings-sync" tape>
              <CardHeader>
                <CardTitle>Subscribe in Google / Apple Calendar</CardTitle>
                <CardDescription>
                  Secret URL — paste into “Subscribe by URL”. Rotate if it leaks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ics-url">ICS URL</Label>
                  <Input
                    id="ics-url"
                    readOnly
                    value={calendarUrl}
                    className="font-mono text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(calendarUrl);
                        toast.success("Copied");
                      }}
                    >
                      Copy URL
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                      onClick={() => void rotateCalendarToken()}
                    >
                      Rotate token
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public-week">Public squad week URL</Label>
                  <p className="text-xs text-muted-foreground">
                    Read-only view of your active guild&apos;s availability for the
                    dashboard week window.
                  </p>
                  <Input
                    id="public-week"
                    readOnly
                    value={publicWeekUrl}
                    className="font-mono text-xs"
                    placeholder="Generate a link to copy…"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={saving}
                    onClick={() => void mintPublicWeekLink()}
                  >
                    Generate public week link
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-prefs">Notification prefs (JSON)</Label>
                  <textarea
                    id="notif-prefs"
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                    value={notificationPrefs}
                    onChange={(e) => setNotificationPrefs(e.target.value)}
                    placeholder='{"discordPing":true}'
                  />
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
