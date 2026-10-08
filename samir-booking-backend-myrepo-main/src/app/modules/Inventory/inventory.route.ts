import { Router } from "express";
import { InventoryController } from "./inventory.controller";
import validateRequest from "../../middlewares/validateRequest";
import { InventoryValidation } from "./inventory.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// update multiple specific inventory items by hotelId
router.patch(
  "/:hotelId/update-multiple",
  auth(UserRole.SERVICE_PROVIDER),
  validateRequest(InventoryValidation.updateMultipleInventoryItemsValidation),
  InventoryController.updateMultipleInventoryItems,
);

// get inventory items by hotelId
router.get(
  "/:hotelId",
  auth(UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  InventoryController.getInventoryByHotelId,
);

export const inventoryRoutes = router;