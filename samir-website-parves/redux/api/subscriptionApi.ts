import { baseApi } from "./baseApi";

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSubscriptionPlan: builder.mutation({
      query: (body) => ({
        url: "/subscriptions/plan/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription"],
    }),
    getAllSubscriptionsPlan: builder.query({
      query: () => ({
        url: "/subscriptions/plan/retrieve/search",
        method: "GET",
      }),
      providesTags: ["Subscription"],
    }),
    getSpecificSubscriptionPlan: builder.query({
      query: (id) => ({
        url: `/subscriptions/plan/retrieve/${id}`,
        method: "GET",
      }),
      providesTags: ["Subscription"],
    }),
    updateSpecificSubscriptionPlan: builder.mutation({
      query: ({ id, body }) => ({
        url: `/subscriptions/plan/update/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Subscription"],
    }),
    deleteSpecificSubscriptionPlan: builder.mutation({
      query: (id) => ({
        url: `/subscriptions/plan/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subscription"],
    }),
    getAllPurchaseSubscription: builder.query({
      query: () => ({
        url: "/subscriptions/purchase-subscription",
        method: "GET",
      }),
      providesTags: ["Subscription"],
    }),
    getMyPurchaseSubscription: builder.query({
      query: () => ({
        url: "/subscriptions/my-purchase-subscription",
        method: "GET",
      }),
      providesTags: ["Subscription"],
    }),
    createSubscription: builder.mutation({
      query: (body) => ({
        url: "/subscriptions/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription"],
    }),
    createCheckoutSessionForSubscription: builder.mutation({
      query: (body) => ({
        url: "/subscriptions/checkout",
        method: "POST",
        body, // contains { planId }
      }),
      invalidatesTags: ["Subscription"],
    }),
  }),
});

export const {
  useCreateSubscriptionPlanMutation,
  useGetAllSubscriptionsPlanQuery,
  useGetSpecificSubscriptionPlanQuery,
  useUpdateSpecificSubscriptionPlanMutation,
  useDeleteSpecificSubscriptionPlanMutation,
  useGetAllPurchaseSubscriptionQuery,
  useGetMyPurchaseSubscriptionQuery,
  useCreateSubscriptionMutation,
  useCreateCheckoutSessionForSubscriptionMutation,
} = subscriptionApi;
