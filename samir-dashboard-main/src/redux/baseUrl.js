import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    // baseUrl: "https://api.hostibook.com/api/v1",
    baseUrl: import.meta.env.VITE_BACKEND_URL || "https://api.hostibook.com/api/v1",
  }),
  tagTypes: [
    "User",
    "Category",
    "Admin",
    "Reports",
    "Gamification",
    "Notification",
    "AdminChannels",
    "UserInfo",
    "FAQ",
    "Provider",
    "Policy",
    "Terms",
    "AboutApp",
  ],
  endpoints: () => ({}),
});
