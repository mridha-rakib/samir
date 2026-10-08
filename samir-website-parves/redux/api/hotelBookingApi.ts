import { baseApi } from "./baseApi";

export const hotelBookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllHotelBookings: builder.query({
      query: (params?: { filter?: string; page?: number; limit?: number }) => ({
        url: "/hotel-booking",
        method: "GET",
        params,
      }),
      providesTags: ["Booking"],
    }),
    getSingleHotelBookingForOwner: builder.query({
      query: () => ({
        url: "/hotel-booking/owner/single",
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),
    getAllMyHotelBookings: builder.query({
      query: () => ({
        url: "/hotel-booking/my-bookings",
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),
    getGuestBookings: builder.query({
      query: (params?: { status?: string; page?: number; limit?: number }) => ({
        url: "/hotel-booking/guest/bookings",
        method: "GET",
        params,
      }),
      providesTags: ["Booking"],
    }),
    getGuestBookingDetails: builder.query({
      query: (bookingId) => ({
        url: `/hotel-booking/guest/bookings/${bookingId}`,
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),
    createHotelBooking: builder.mutation({
      query: ({ hotelId, body }) => ({
        url: `/hotel-booking/${hotelId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Booking"],
    }),
    createTravelers: builder.mutation({
      query: ({ bookingId, body }) => ({
        url: `/hotel-booking/travelers/${bookingId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Booking"],
    }),
    getSingleMyHotelBookingForUser: builder.query({
      query: (bookingId) => ({
        url: `/hotel-booking/my-bookings/user/single/${bookingId}`,
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),
    checkAccessForHotel: builder.query({
      query: (hotelId) => ({
        url: `/hotel-booking/check-access/${hotelId}`,
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),
    getHotelBookingById: builder.query({
      query: (bookingId) => ({
        url: `/hotel-booking/${bookingId}`,
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),
  }),
});

export const {
  useGetAllHotelBookingsQuery,
  useGetSingleHotelBookingForOwnerQuery,
  useGetAllMyHotelBookingsQuery,
  useGetGuestBookingsQuery,
  useGetGuestBookingDetailsQuery,
  useCreateHotelBookingMutation,
  useCreateTravelersMutation,
  useGetSingleMyHotelBookingForUserQuery,
  useCheckAccessForHotelQuery,
  useGetHotelBookingByIdQuery,
} = hotelBookingApi;
