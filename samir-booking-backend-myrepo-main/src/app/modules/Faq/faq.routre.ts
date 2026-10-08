import express from "express";
import { FaqController } from "./faq.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { cacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = express.Router();

// create faq
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  FaqController.createFaq
);

// get all faq
router.get("/", cacheMiddleware(300), FaqController.getAllFaq);

// get single faq
router.get("/:id", cacheMiddleware(300), FaqController.getSingleFaq);

// update only faq
router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  FaqController.updateFaq
);

// delete faq
router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  FaqController.deleteFaq
);

export const faqRoutes = router;
