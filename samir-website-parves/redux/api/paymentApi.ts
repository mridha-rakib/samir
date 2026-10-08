import { baseApi } from "./baseApi";

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    stripeAccountOnboarding: builder.mutation({
      query: () => ({
        url: "/payments/stripe-account-onboarding",
        method: "POST",
      }),
      invalidatesTags: ["Payment"],
    }),
    createStripeCheckoutSessionHotel: builder.mutation({
      query: (bookingId) => ({
        url: `/payments/create-stripe-checkout-session-hotel/${bookingId}`,
        method: "POST",
      }),
      invalidatesTags: ["Payment", "Booking"],
    }),
    createStripeCheckoutSessionService: builder.mutation({
      query: (bookingId) => ({
        url: `/payments/create-stripe-checkout-session-service/${bookingId}`,
        method: "POST",
      }),
      invalidatesTags: ["Payment", "ServiceBooking"],
    }),
    cancelStripeBooking: builder.mutation({
      query: ({ serviceType, bookingId }) => ({
        url: `/payments/stripe-cancel-booking/${serviceType}/${bookingId}`,
        method: "POST",
      }),
      invalidatesTags: ["Payment", "Booking", "ServiceBooking"],
    }),
    getMyTransactions: builder.query({
      query: () => ({
        url: "/payments/my-orders",
        method: "GET",
      }),
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useStripeAccountOnboardingMutation,
  useCreateStripeCheckoutSessionHotelMutation,
  useCreateStripeCheckoutSessionServiceMutation,
  useCancelStripeBookingMutation,
  useGetMyTransactionsQuery,
} = paymentApi;
