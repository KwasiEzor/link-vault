import { z } from "zod";

export const linkSchema = z.object({
  url: z.string().url("Invalid URL format").min(1, "URL is required"),
  category: z.string().min(1, "Category is required").default("general"),
});

export const updateLinkSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  url: z.string().url("Invalid URL format").optional(),
  image: z.string().nullable().optional(),
});

export type LinkInput = z.infer<typeof linkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
