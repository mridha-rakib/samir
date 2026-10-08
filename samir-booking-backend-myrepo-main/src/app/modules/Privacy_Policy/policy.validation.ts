import { z } from "zod";

export const createPrivacyPolicySchema = z.object({
  body: z.object({
    description: z.string({ required_error: "Description is required" }).min(10, "Description must be at least 10 characters"),
  }),
});

export const privacyPolicyValidation = {
  createPrivacyPolicySchema,
};
