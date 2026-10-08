import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { TermsController } from "./terms.controller";
import { cacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = express.Router();

// get terms and conditions
router.get(
  "/",
  cacheMiddleware(600),
  TermsController.getTerms
);

// create or update terms and conditions
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  // validateRequest(termsConditionValidation.termsConditionSchema),
  TermsController.createOrUpdateTerms
);

export const termsConditionRoute = router;
