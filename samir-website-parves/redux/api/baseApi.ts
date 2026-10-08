import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL || "https://api.hostibook.com/api/v1",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", token);
      }
      return headers;
    },
  }),


  // tagTypes 
  tagTypes: [
    "User",
    "Auth",
    "Hotel",
    "Booking",
    "Service",
    "ServiceBooking",
    "Chat",
    "Notification",
    "Faq",
    "Policy",
    "Favorite",
    "Review",
    "Payment",
    "Subscription",
    "Statistics",
    "Support",
    "Setting",
    "Phone",
    "ShowUserInfo"
  ],
  endpoints: () => ({}),
});
