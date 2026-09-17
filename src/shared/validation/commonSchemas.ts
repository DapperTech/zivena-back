import { z } from "zod";

export const metadataSchema = z.record(z.string(), z.unknown()).default({});

export const idParamsSchema = z.object({
  id: z.string().min(1)
});

export const emptyBodySchema = z.object({});
export const emptyQuerySchema = z.object({});

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");
