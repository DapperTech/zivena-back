import { z } from "zod";

export const metadataSchema = z.record(z.string(), z.unknown()).default({});

export const idParamsSchema = z.object({
  id: z.string().min(1)
});

export const emptyBodySchema = z.object({});
export const emptyQuerySchema = z.object({});

export const booleanQuerySchema = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform((value) => value === "true")
]);

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");
