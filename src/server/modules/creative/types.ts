import { z } from 'zod';

export const JobStatusSchema = z.enum([
  'pending',
  'concept',
  'da_draw',
  'asset_plat',
  'composition',
  'critic',
  'captions',
  'completed',
  'failed',
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ImageResultSchema = z.object({
  format: z.string(),
  url: z.string(),
  da_family: z.string(),
  reference_ids: z.array(z.string()).default([]),
});

export const CaptionVariantSchema = z.object({
  tone: z.string(),
  text: z.string(),
  hashtags: z.array(z.string()),
});

export const CaptionChannelSchema = z.object({
  channel: z.enum(['instagram', 'facebook', 'tiktok']),
  variants: z.array(CaptionVariantSchema),
});

export const CriticReportSchema = z.object({
  pass: z.boolean(),
  facts_ok: z.boolean(),
  errors: z.array(z.string()).default([]),
  style_score: z.number().default(100),
  instructions_de_correction: z.string().nullable().optional(),
});

export const PromptVariantSchema = z.object({
  variant_id: z.string(),
  angle_name: z.string(),
  headline: z.string(),
  composition_brief: z.string(),
  score: z.number(),
  evaluation_details: z.object({
    compliance: z.number(),
    readability: z.number(),
    hierarchy: z.number(),
    cta_impact: z.number(),
    event_coherence: z.number(),
  }),
  is_selected: z.boolean(),
  rejection_reason: z.string().nullable().optional(),
});

export type PromptVariant = z.infer<typeof PromptVariantSchema>;

export const LogoConfigSchema = z.object({
  logo_url: z.string().nullable().optional(),
  position: z.enum(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-right']).default('top-left'),
  min_size_percent: z.number().default(15),
  safe_margin_px: z.number().default(24),
  contrast_background: z.boolean().default(true),
});

export type LogoConfig = z.infer<typeof LogoConfigSchema>;

export const EventContextSchema = z.object({
  event_name: z.string().nullable().optional(),
  user_override_theme: z.string().nullable().optional(),
  calendar_event: z.string().nullable().optional(),
  active_priority: z.enum(['user_instruction', 'calendar_event', 'default_brand']).default('default_brand'),
});

export type EventContext = z.infer<typeof EventContextSchema>;

export const CreativePackageSchema = z.object({
  job_id: z.string(),
  images: z.array(ImageResultSchema),
  captions: z.array(CaptionChannelSchema),
  rationale: z.string(),
  facts_used: z.array(z.string()),
  quality_score: z.number(),
  critic_report: CriticReportSchema.nullable().optional(),
  prompt_variants: z.array(PromptVariantSchema).default([]),
  selected_variant_id: z.string().nullable().optional(),
  cost: z.number(),
  timings: z.record(z.string(), z.number()),
});

export type CreativePackage = z.infer<typeof CreativePackageSchema>;

export interface JobInput {
  userId: string;
  offer: string;
  details: string;
  campaignType?: string | null;
  aspectRatio?: string | null;
  referenceImagePath?: string | string[] | null;
  logoUrl?: string | null;
  userThemeOverride?: string | null;
  calendarEvent?: string | null;
  phone?: string | null;
  socialHandle?: string | null;
}
