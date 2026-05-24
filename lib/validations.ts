import { z } from "zod";
import { parseRecurrenceRule } from "@/lib/recurrence";

export const isoDateTime = z.string().datetime({ offset: true });

export const availabilityStatusSchema = z.enum(["free", "tentative", "busy"]);

export const availabilityBlockInput = z.object({
  start: isoDateTime,
  end: isoDateTime,
  label: z.string().max(100).optional(),
  status: availabilityStatusSchema.optional(),
  lfgNote: z.string().max(200).optional().nullable(),
  recurrenceRule: z.string().max(4000).optional().nullable(),
  seriesId: z.string().max(128).optional().nullable(),
});

export const availabilityCreateSchema = availabilityBlockInput
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End must be after start",
    path: ["end"],
  })
  .superRefine((data, ctx) => {
    if (data.recurrenceRule == null || data.recurrenceRule === "") return;
    const parsed = parseRecurrenceRule(data.recurrenceRule);
    if (!parsed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid recurrenceRule JSON",
        path: ["recurrenceRule"],
      });
    }
  });

export const availabilityUpdateSchema = availabilityCreateSchema;

export const availabilityBulkSchema = z
  .object({
    blocks: z.array(availabilityBlockInput).min(0),
  })
  .superRefine((data, ctx) => {
    data.blocks.forEach((b, i) => {
      if (b.recurrenceRule == null || b.recurrenceRule === "") return;
      if (!parseRecurrenceRule(b.recurrenceRule)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid recurrenceRule JSON",
          path: ["blocks", i, "recurrenceRule"],
        });
      }
    });
  });

export const campaignPhaseSchema = z.enum([
  "interest",
  "scheduling",
  "scheduled",
]);

export const eventCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    phase: campaignPhaseSchema.default("interest"),
    start: isoDateTime.optional(),
    end: isoDateTime.optional(),
    visibility: z.enum(["private", "friends", "public"]).default("private"),
    maxParticipants: z.number().int().min(1).max(500).optional().nullable(),
    participantUserIds: z.array(z.string()).optional(),
    templateId: z.string().min(1).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.phase === "scheduled") {
      if (!data.start || !data.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled events require start and end",
          path: ["start"],
        });
        return;
      }
      if (new Date(data.end) <= new Date(data.start)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End must be after start",
          path: ["end"],
        });
      }
    }
  });

export const phaseTransitionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open_scheduling") }),
  z.object({ action: z.literal("reopen_interest") }),
  z.object({
    action: z.literal("finalize"),
    proposalId: z.string().min(1),
  }),
]);

export const proposalCreateSchema = z
  .object({
    start: isoDateTime,
    end: isoDateTime,
  })
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End must be after start",
    path: ["end"],
  });

export const voteSchema = z.union([
  z.object({
    proposalId: z.string().min(1),
  }),
  z.object({
    proposalIds: z.array(z.string().min(1)).min(1).max(64),
  }),
]);

export const expenseCreateSchema = z.object({
  label: z.string().min(1).max(120),
  amountCents: z.number().int().min(0).max(100_000_000),
  paidById: z.string().min(1).optional().nullable(),
  splits: z.string().max(8000).optional().nullable(),
});

export const expenseUpdateSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  amountCents: z.number().int().min(0).max(100_000_000).optional(),
  sortOrder: z.number().int().min(0).optional(),
  paidById: z.string().min(1).optional().nullable(),
  splits: z.string().max(8000).optional().nullable(),
});

export const participationStatusValues = [
  "interested",
  "not_interested",
  "accepted",
  "declined",
  "pending",
] as const;

export const participationPatchSchema = z.object({
  status: z.enum(participationStatusValues),
  roleId: z.string().min(1).optional().nullable(),
  isBackup: z.boolean().optional(),
  /** Host may update another member's bench / role fields */
  targetUserId: z.string().min(1).optional(),
});

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const botEventCreateSchema = z
  .object({
    discordId: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    start: isoDateTime,
    end: isoDateTime,
    visibility: z.enum(["private", "friends", "public"]).default("private"),
    participantDiscordIds: z.array(z.string()).optional(),
  })
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End must be after start",
    path: ["end"],
  });

export const preferencesSchema = z.object({
  timezone: z.string().min(1).max(64).optional(),
  theme: z
    .enum([
      "light",
      "dark",
      "system",
      "bob2142",
      "voicedrew",
      "crainingaming",
    ])
    .optional(),
  font: z.enum(["caveat", "patrick", "kalam", "comic"]).optional(),
  notificationPrefs: z.string().max(16_000).optional().nullable(),
  lastGuildId: z.string().min(1).max(128).optional().nullable(),
  rotateCalendarToken: z.literal(true).optional(),
  awayUntil: isoDateTime.optional().nullable(),
  quietHours: z.string().max(4000).optional().nullable(),
  energyPreference: z
    .enum(["morning", "afternoon", "evening", "night", "flex"])
    .optional()
    .nullable(),
  weatherCity: z.string().max(120).optional().nullable(),
  weatherLatitude: z.number().min(-90).max(90).optional().nullable(),
  weatherLongitude: z.number().min(-180).max(180).optional().nullable(),
});

export const geocodeQuerySchema = z.object({
  q: z.string().min(2).max(80),
});

export const weatherWeekQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const rangeQuerySchema = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
});

export const eventUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    start: isoDateTime.optional(),
    end: isoDateTime.optional(),
    visibility: z.enum(["private", "friends", "public"]).optional(),
    maxParticipants: z.number().int().min(1).max(500).optional().nullable(),
    costCurrency: z.string().min(3).max(3).optional(),
    costSplitEvenly: z.boolean().optional(),
    archived: z.boolean().optional(),
    seasonId: z.string().min(1).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.start && data.end) {
        return new Date(data.end) > new Date(data.start);
      }
      return true;
    },
    { message: "End must be after start", path: ["end"] },
  );

export const eventParticipantsAddSchema = z.object({
  userIds: z.array(z.string()).min(1),
});

export const planItemKindSchema = z.enum([
  "step",
  "ride",
  "pack",
  "meal",
  "other",
]);

export const itineraryItemCreateSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  url: z.string().max(2000).optional().nullable(),
  checklist: z.string().max(8000).optional().nullable(),
  startsAt: isoDateTime.optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  kind: planItemKindSchema.optional(),
  location: z.string().max(500).optional().nullable(),
});

export const itineraryItemUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  checklist: z.string().max(8000).optional().nullable(),
  startsAt: isoDateTime.optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  kind: planItemKindSchema.optional(),
  location: z.string().max(500).optional().nullable(),
});

export const itineraryBulkSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().min(1).max(200),
      notes: z.string().max(2000).optional(),
      startsAt: isoDateTime.optional().nullable(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  ),
});

export const eventResourceKindSchema = z.enum(["link", "note", "location"]);
export type EventResourceKind = z.infer<typeof eventResourceKindSchema>;

const httpUrlSchema = z
  .string()
  .max(2000)
  .refine(
    (v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid http(s) URL" },
  );

function resourceFieldsRefine(
  data: {
    kind: z.infer<typeof eventResourceKindSchema>;
    url?: string | null;
    body?: string | null;
    address?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (data.kind === "link") {
    if (!data.url?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL is required for links",
        path: ["url"],
      });
    }
  }
  if (data.kind === "note") {
    if (!data.body?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Note text is required",
        path: ["body"],
      });
    }
  }
  if (data.kind === "location") {
    if (!data.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required for locations",
        path: ["address"],
      });
    }
  }
}

export const eventResourceCreateSchema = z
  .object({
    kind: eventResourceKindSchema,
    title: z.string().min(1).max(120),
    url: httpUrlSchema.optional().nullable(),
    body: z.string().max(2000).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
  })
  .superRefine(resourceFieldsRefine);

export const eventResourceUpdateSchema = z
  .object({
    kind: eventResourceKindSchema.optional(),
    title: z.string().min(1).max(120).optional(),
    url: httpUrlSchema.optional().nullable(),
    body: z.string().max(2000).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind) {
      resourceFieldsRefine(
        {
          kind: data.kind,
          url: data.url,
          body: data.body,
          address: data.address,
        },
        ctx,
      );
    }
  });

export const eventResourceReorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export const botParticipantsAddSchema = z.object({
  discordIds: z.array(z.string()).min(1),
});

export const freeUsersQuerySchema = z
  .object({
    start: isoDateTime,
    end: isoDateTime,
  })
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End must be after start",
    path: ["end"],
  });

export const availabilityCopyWeekSchema = z.object({
  sourceWeekStart: isoDateTime,
  targetWeekStart: isoDateTime,
});

export const campaignTemplateCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(15).max(24 * 60).optional(),
  visibility: z.enum(["private", "friends", "public"]).optional(),
  maxParticipants: z.number().int().min(1).max(500).optional().nullable(),
  costSplitEvenly: z.boolean().optional(),
  defaultPhase: campaignPhaseSchema.optional(),
});

export const campaignTemplateUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(15).max(24 * 60).optional(),
  visibility: z.enum(["private", "friends", "public"]).optional(),
  maxParticipants: z.number().int().min(1).max(500).optional().nullable(),
  costSplitEvenly: z.boolean().optional(),
  defaultPhase: campaignPhaseSchema.optional(),
});

export const eventGuestCreateSchema = z.object({
  guestEmail: z.string().email().max(320),
  displayName: z.string().min(1).max(120),
});

export const squadGroupCreateSchema = z.object({
  name: z.string().min(1).max(120),
  memberUserIds: z.array(z.string()).max(200).optional(),
});

export const squadGroupUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
});

export const squadGroupMembersSchema = z.object({
  userIds: z.array(z.string()).min(1).max(200),
});

export const softHoldCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    start: isoDateTime,
    end: isoDateTime,
    expiresAt: isoDateTime.optional(),
  })
  .refine((d) => new Date(d.end) > new Date(d.start), {
    message: "End must be after start",
    path: ["end"],
  });

export const seasonCreateSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(32).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const seasonUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  color: z.string().max(32).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const wallNoteCreateSchema = z.object({
  body: z.string().min(1).max(2000),
  expiresAt: isoDateTime,
});

export const eventOptionCreateSchema = z.object({
  label: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).optional(),
});

export const eventOptionVoteSchema = z.object({
  optionId: z.string().min(1),
});

export const weekCompareQuerySchema = z.object({
  weekAStart: isoDateTime,
  weekBStart: isoDateTime,
});

const MAX_FIND_SLOTS_RANGE_MS = 14 * 24 * 60 * 60 * 1000;

export const findSlotsQuerySchema = z
  .object({
    from: isoDateTime,
    to: isoDateTime,
    durationMinutes: z.coerce.number().int().min(15).max(24 * 60),
    eventId: z.string().min(1).optional(),
    participantUserIds: z
      .string()
      .optional()
      .transform((s) =>
        s
          ? s
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
          : undefined,
      ),
    includeTentative: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
  })
  .superRefine((data, ctx) => {
    const from = new Date(data.from);
    const to = new Date(data.to);
    if (to <= from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "to must be after from",
        path: ["to"],
      });
      return;
    }
    if (to.getTime() - from.getTime() > MAX_FIND_SLOTS_RANGE_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Range cannot exceed 14 days",
        path: ["to"],
      });
    }
  });

export const eventRoleCreateSchema = z.object({
  name: z.string().min(1).max(120),
  maxCount: z.number().int().min(1).max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const eventRoleUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  maxCount: z.number().int().min(1).max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});
