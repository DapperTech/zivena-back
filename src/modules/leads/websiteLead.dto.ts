import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema } from "../../shared/validation/commonSchemas";

const contactFields = {
  name: z.string().trim().min(2).max(140),
  company: z.string().trim().max(180).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().min(7).max(40).optional(),
  message: z.string().trim().max(4000).optional()
};

const productSchema = z.strictObject({
  productId: z.string().trim().max(120).optional(),
  sku: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(240),
  quantity: z.number().int().min(1).max(10_000_000),
  technique: z.string().trim().max(140).optional(),
  imageUrl: z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), "Use an HTTP(S) image URL").optional()
});

export const websiteLeadPayloadSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("contact"),
    ...contactFields
  }),
  z.strictObject({
    type: z.literal("quotation"),
    ...contactFields,
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(7).max(40),
    deadline: z.iso.datetime({ offset: true }).optional(),
    products: z.array(productSchema).min(1).max(100)
  })
]).superRefine((payload, context) => {
  if (payload.type === "contact" && !payload.email && !payload.phone) {
    context.addIssue({
      code: "custom",
      path: ["email"],
      message: "Provide an email or phone number"
    });
  }
});

export const submitWebsiteLeadSchema = z.object({
  body: websiteLeadPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export type WebsiteLeadSubmissionDto = z.infer<typeof websiteLeadPayloadSchema>;
export type WebsiteContactDto = Extract<WebsiteLeadSubmissionDto, { type: "contact" }>;
