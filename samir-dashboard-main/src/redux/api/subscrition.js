import { baseApi } from "../baseUrl";

// subscription api
export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all subscriptions
    getAllSubscriptions: builder.query({
      query: ({ status }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        return {
          url: `/subscriptions/purchase-subscription${
            params.toString() ? "?" + params.toString() : ""
          }`,
          method: "GET",
          headers: {
            Authorization: `${localStorage.getItem("accessToken")}`,
          },
        };
      },
      providesTags: ["Subscription"],
    }),

    // get all subscription plans
    getAllSubscriptionPlans: builder.query({
      query: () => ({
        url: `/subscriptions/plan/retrieve/search`,
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Subscription"],
    }),

    // create subscription plan
    createSubscriptionPlan: builder.mutation({
      query: (planData) => ({
        url: `/subscriptions/plan/create`,
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        body: planData,
      }),
      invalidatesTags: ["Subscription"],
    }),

    // update subscription plan
    updateSubscriptionPlan: builder.mutation({
      query: ({ id, ...planData }) => ({
        url: `/subscriptions/plan/update/${id}`,
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        body: planData,
      }),
      invalidatesTags: ["Subscription"],
    }),

    // delete subscription plan
    cancelSubscription: builder.mutation({
      query: (id) => ({
        url: `/subscriptions/plan/delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Subscription"],
    }),
  }),
});

export const {
  useGetAllSubscriptionsQuery,
  useCancelSubscriptionMutation,
  useGetAllSubscriptionPlansQuery,
  useUpdateSubscriptionPlanMutation,
  useCreateSubscriptionPlanMutation,
} = subscriptionApi;
