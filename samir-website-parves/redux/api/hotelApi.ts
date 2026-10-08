import { baseApi } from "./baseApi";

export const hotelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllHotels: builder.query({
      query: (params) => ({
        url: "/hotels",
        method: "GET",
        params,
      }),
      providesTags: ["Hotel"],
    }),
    getPartnerHotels: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: "/hotels/partner-hotels",
        method: "GET",
        params,
      }),
      providesTags: ["Hotel"],
    }),
    getSelectMyProperties: builder.query({
      query: () => ({
        url: "/hotels/select-my-properties",
        method: "GET",
      }),
      providesTags: ["Hotel"],
    }),
    getSingleHotel: builder.query({
      query: (id) => ({
        url: `/hotels/${id}`,
        method: "GET",
      }),
      providesTags: ["Hotel"],
    }),
    getMyFavorites: builder.query({
      query: () => ({
        url: "/hotels/my-favorites",
        method: "GET",
      }),
      providesTags: ["Hotel"],
    }),
    toggleFavorite: builder.mutation({
      query: (hotelId) => ({
        url: `/hotels/favorite/${hotelId}`,
        method: "POST",
      }),
      invalidatesTags: ["Hotel"],
    }),
    createHotel: builder.mutation({
      query: (body) => ({
        url: "/hotels",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Hotel"],
    }),
    updateHotel: builder.mutation({
      query: ({ hotelId, body }) => ({
        url: `/hotels/${hotelId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Hotel"],
    }),
    deleteHotel: builder.mutation({
      query: (hotelId) => ({
        url: `/hotels/${hotelId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hotel"],
    }),
    createGuard: builder.mutation({
      query: ({ hotelId, body }) => ({
        url: `/hotels/guard/${hotelId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Hotel"],
    }),
    updateCategory: builder.mutation({
      query: ({ hotelId, body }) => ({
        url: `/hotels/update-category/${hotelId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Hotel"],
    }),
    getInventoryByHotelId: builder.query({
      query: (hotelId) => ({
        url: `/inventory/${hotelId}`,
        method: "GET",
      }),
      providesTags: ["Hotel"],
    }),
  }),
});

export const {
  useGetAllHotelsQuery,
  useGetPartnerHotelsQuery,
  useGetSelectMyPropertiesQuery,
  useGetSingleHotelQuery,
  useGetMyFavoritesQuery,
  useToggleFavoriteMutation,
  useCreateHotelMutation,
  useUpdateHotelMutation,
  useDeleteHotelMutation,
  useCreateGuardMutation,
  useUpdateCategoryMutation,
  useGetInventoryByHotelIdQuery,
} = hotelApi;
