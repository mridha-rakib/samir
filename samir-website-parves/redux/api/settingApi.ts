import { baseApi } from "./baseApi";

export const settingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAbout: builder.query({
      query: () => ({
        url: "/settings/about",
        method: "GET",
      }),
      providesTags: ["Setting"],
    }),
    getCustomerContact: builder.query({
      query: () => ({
        url: "/settings/customer-contact",
        method: "GET",
      }),
      providesTags: ["Setting"],
    }),
    createOrUpdateAbout: builder.mutation({
      query: (body) => ({
        url: "/settings/about",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Setting"],
    }),
    createCustomerContact: builder.mutation({
      query: (body) => ({
        url: "/settings/customer-contact",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Setting"],
    }),
    updateNotificationSettings: builder.mutation({
      query: (body) => ({
        url: "/settings/notification-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Setting"],
    }),
  }),
});

export const {
  useGetAboutQuery,
  useGetCustomerContactQuery,
  useCreateOrUpdateAboutMutation,
  useCreateCustomerContactMutation,
  useUpdateNotificationSettingsMutation,
} = settingApi;
