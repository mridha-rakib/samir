import { z } from "zod";

// custom price schema - supports both single date and date range
const customPriceSchema = z
  .object({
    date: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
      })
      .optional(),
    startDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
      })
      .optional(),
    endDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
      })
      .optional(),
    price: z.number().positive("Price must be positive"),
  })
  .refine(
    (data) => {
      // Either provide single date OR both startDate and endDate
      if (data.date) {
        return true; // single date is valid
      }
      if (data.startDate && data.endDate) {
        return true; // date range is valid
      }
      return false; // invalid combination
    },
    {
      message:
        "Either provide 'date' for single day pricing OR both 'startDate' and 'endDate' for date range pricing",
    },
  );

// inventory item schema
const inventoryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

// local tip schema
const localTipSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  subcategoryImage: z.string().optional(),
  floor_details: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

const createHotelSchema = z.object({
  body: z.object({
    // propertyName: z.string().min(1, "Property name is required"),
    propertyTitle: z.string().min(1, "Property title is required"),
    propertyAddress: z.string().min(1, "Property address is required"),
    propertyDescription: z.string().min(1, "Property description is required"),
    latitude: z.string().min(1, "Latitude is required"),
    longitude: z.string().min(1, "Longitude is required"),
    // capacity
    maxGuests: z.string().min(1, "Max guests is required"),
    bedrooms: z.string().min(1, "Bedrooms is required"),
    bathrooms: z.string().min(1, "Bathrooms is required"),
    // security Access
    smartLockCode: z.string({ required_error: "Smart lock code is required" }).min(4, "Smart lock code must be at least 4 characters"),
    keyBoxPin: z.string({ required_error: "Key box pin is required" }).min(4, "Key box pin must be at least 4 characters"),
    wifiPassword: z.string({ required_error: "Wifi password is required" }).min(4, "Wifi password must be at least 4 characters"),
    // amenities (JSON string)
    amenities: z.string().min(1, "Amenities are required"),
    // additional info
    addSecurityKeys: z.string().optional(),
    addLocalTips: z.union([z.string(), z.array(localTipSchema)]).optional(),
    // pricing
    basePrice: z.string().min(1, "Base price is required"),
    weeklyOffers: z.string().optional(),
    monthlyOffers: z.string().optional(),
    // custom prices
    customPrices: z.string().optional(),
    // inventory items
    inventoryItems: z.string().optional(),
    syncWithAirbnb: z.string().optional().default("false"),
    airbnbIcalUrl: z
      .string()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          try {
            const parsed = new URL(val.trim());
            return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "webcal:";
          } catch {
            return false;
          }
        },
        { message: "Invalid Airbnb iCal URL format. Must be a valid web link (http/https)." }
      )
      .optional(),
  }),
});

// update hotel schema
const updateHotelSchema = z.object({
  body: z.object({
    // propertyName: z.string().min(1, "Property name is required").optional(),
    propertyTitle: z.string().min(1, "Property title is required").optional(),
    propertyAddress: z
      .string()
      .min(1, "Property address is required")
      .optional(),
    propertyDescription: z
      .string()
      .min(1, "Property description is required")
      .optional(),

    latitude: z.string().optional(),
    longitude: z.string().optional(),

    maxGuests: z.string().optional(),
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),

    smartLockCode: z.string().optional(),
    keyBoxPin: z.string().optional(),
    wifiPassword: z.string().optional(),

    amenities: z.string().optional(),

    addSecurityKeys: z.string().optional(),
    addLocalTips: z.string().optional(),

    basePrice: z.string().optional(),
    weeklyOffers: z.string().optional(),
    monthlyOffers: z.string().optional(),
    // custom prices
    customPrices: z.string().optional(),
    // inventory items
    inventoryItems: z.string().optional(),
    syncWithAirbnb: z.string().optional().default("false"),
    airbnbIcalUrl: z
      .string()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          try {
            const parsed = new URL(val.trim());
            return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "webcal:";
          } catch {
            return false;
          }
        },
        { message: "Invalid Airbnb iCal URL format. Must be a valid web link (http/https)." }
      )
      .optional(),
  }),
});

// update hotel category schema
const updateHotelCategorySchema = z.object({
  body: z.object({
    addLocalTips: z.array(
      z.object({
        category: z.string().optional(),
        subcategory: z.string().optional(),
        subcategoryImage: z.string().optional(),
        floor_details: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        isActive: z.union([z.boolean(), z.string()]).optional(),
      })
    ).optional(),
  }),
});

// guard validation schema
const createGuardSchema = z.object({
  body: z.object({
    // hotelId: z.string().min(1, "Hotel ID is required"),
    name: z.string({ required_error: "Guard name is required" }),
    phone: z.string().min(1, "Guard phone is required"),
    whatsapp: z.string({ required_error: "Guard whatsapp is required" }),
    status: z.enum(["AVAILABLE", "ON_DUTY", "OFF_DUTY"]).optional(),
  }),
});

export const hotelValidation = {
  createHotelSchema,
  updateHotelSchema,
  createGuardSchema,
  customPriceSchema,
  inventoryItemSchema,
  localTipSchema,
  updateHotelCategorySchema,
};
