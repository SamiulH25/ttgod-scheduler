import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

export type NavLinkDef = {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  badgeKey?: "events";
};

export type NavSectionDef = {
  title: string;
  links: NavLinkDef[];
};

export const navSections: NavSectionDef[] = [
  {
    title: "Plan",
    links: [
      {
        href: "/dashboard",
        label: "Hub",
        hint: "Overlaps & find a time",
        icon: LayoutDashboard,
      },
      {
        href: "/availability",
        label: "Calendar",
        hint: "Post your availability",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Squad",
    links: [
      {
        href: "/events",
        label: "Campaigns",
        hint: "Interest → schedule → pin",
        icon: CalendarDays,
        badgeKey: "events",
      },
      {
        href: "/squad",
        label: "Team",
        hint: "Roster & activity",
        icon: Users,
      },
    ],
  },
];

export const settingsNavLink: NavLinkDef = {
  href: "/settings",
  label: "Settings",
  hint: "Theme, rhythm, links",
  icon: Settings,
};

/** Flat list for mobile drawer */
export const navLinksFlat: NavLinkDef[] = [
  ...navSections.flatMap((s) => s.links),
  settingsNavLink,
];
