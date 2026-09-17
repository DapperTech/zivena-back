import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema, idParamsSchema, metadataSchema } from "../../shared/validation/commonSchemas";

const userPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  profileImage: z.string().url().optional(),
  role: z.enum(["admin", "sales"]).default("sales"),
  metadata: metadataSchema.default({}),
  isActive: z.boolean().default(true)
});

export const createUserSchema = z.object({
  body: userPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateUserSchema = z.object({
  body: userPayloadSchema.partial(),
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const userByIdSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export type CreateUserDto = z.infer<typeof createUserSchema>["body"];
export type UpdateUserDto = z.infer<typeof updateUserSchema>["body"];
