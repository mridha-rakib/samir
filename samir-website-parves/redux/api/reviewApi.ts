import { baseApi } from "./baseApi";

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createHotelReview: builder.mutation({
      query: (body) => ({
        url: "/reviews/hotel",
        method: "POST",
        body, // contains { hotelId, rating, comment }
      }),
      invalidatesTags: ["Review", "Hotel"],
    }),
    createServiceReview: builder.mutation({
      query: (body) => ({
        url: "/reviews/service",
        method: "POST",
        body, // contains { serviceId, rating, comment }
      }),
      invalidatesTags: ["Review", "Service"],
    }),
    createPropertyOwnerReview: builder.mutation({
      query: (body) => ({
        url: "/reviews/property-owner-by-service-provider",
        method: "POST",
        body, // contains { propertyOwnerId, rating, comment }
      }),
      invalidatesTags: ["Review", "User"],
    }),
    submitReviewViaToken: builder.mutation({
      query: (body) => ({
        url: "/reviews/submit-via-token",
        method: "POST",
        body, // contains { token, rating, comment }
      }),
      invalidatesTags: ["Review", "Hotel"],
    }),
  }),
});

export const {
  useCreateHotelReviewMutation,
  useCreateServiceReviewMutation,
  useCreatePropertyOwnerReviewMutation,
  useSubmitReviewViaTokenMutation,
} = reviewApi;
