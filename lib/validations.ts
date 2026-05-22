import { z } from "zod";

export const isoDateTime = z.string().datetime({ offset: true });

export const availabilityBlockInput = z.object({
  start: isoDateTime,
  end: isoDateTime,
  label: z.string().max(100).optional(),
});

export const availabilityCreateSchema = availabilityBlockInput.refine(
  (data) => new Date(data.end) > new Date(data.start),
  { message: "End must be after start", path: ["end"] },
);

export const availabilityUpdateSchema = availabilityCreateSchema;

export const availabilityBulkSchema = z.object({
  blocks: z.array(availabilityBlockInput).min(0),
});

export const eventCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    start: isoDateTime,
    end: isoDateTime,
    visibility: z.enum(["private", "friends", "public"]).default("private"),
    participantUserIds: z.array(z.string()).optional(),
  })
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End must be after start",
    path: ["end"],
  });

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

export const itineraryItemCreateSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  startsAt: isoDateTime.optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const itineraryItemUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).optional().nullable(),
  startsAt: isoDateTime.optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
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

export type AvailabilityBlockInput = z.infer<typeof availabilityBlockInput>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
