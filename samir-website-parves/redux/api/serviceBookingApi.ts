import { baseApi } from "./baseApi";

export const serviceBookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createServiceBooking: builder.mutation({
      query: ({ serviceId, body }) => ({
        url: `/service-booking/${serviceId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    acceptBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/service-booking/${bookingId}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    inProgressBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/service-booking/${bookingId}/in-progress`,
        method: "POST",
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    completeBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/service-booking/${bookingId}/complete-by-provider`,
        method: "POST",
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    rejectBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/service-booking/${bookingId}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    cancelBookingByOwner: builder.mutation({
      query: (bookingId) => ({
        url: `/service-booking/${bookingId}/cancel-by-owner`,
        method: "POST",
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    confirmBookingAndReleasePayment: builder.mutation({
      query: (bookingId) => ({
        url: `/service-booking/${bookingId}/confirm-by-owner`,
        method: "POST",
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    getActivePastBookings: builder.query({
      query: (params?: { bookingType?: string; page?: number; limit?: number }) => ({
        url: "/service-booking/active-past-bookings",
        method: "GET",
        params,
      }),
      providesTags: ["ServiceBooking"],
    }),
    getSingleServiceBooking: builder.query({
      query: (bookingId) => ({
        url: `/service-booking/${bookingId}`,
        method: "GET",
      }),
      providesTags: ["ServiceBooking"],
    }),
    getAllServiceBookingsOfProvider: builder.query({
      query: (params) => ({
        url: "/service-booking/provider/bookings",
        method: "GET",
        params,
      }),
      providesTags: ["ServiceBooking"],
    }),
    uploadStartingProofVideo: builder.mutation({
      query: ({ bookingId, body }) => ({
        url: `/record-proof-video/${bookingId}/starting-proof`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    uploadEndingProofVideo: builder.mutation({
      query: ({ bookingId, body }) => ({
        url: `/record-proof-video/${bookingId}/ending-proof`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ServiceBooking"],
    }),
    updateMultipleInventoryItems: builder.mutation({
      query: ({ hotelId, body }) => ({
        url: `/inventory/${hotelId}/update-multiple`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Hotel"],
    }),
  }),
});

export const {
  useCreateServiceBookingMutation,
  useAcceptBookingMutation,
  useInProgressBookingMutation,
  useCompleteBookingMutation,
  useRejectBookingMutation,
  useCancelBookingByOwnerMutation,
  useConfirmBookingAndReleasePaymentMutation,
  useGetActivePastBookingsQuery,
  useGetSingleServiceBookingQuery,
  useGetAllServiceBookingsOfProviderQuery,
  useUploadStartingProofVideoMutation,
  useUploadEndingProofVideoMutation,
  useUpdateMultipleInventoryItemsMutation,
} = serviceBookingApi;
