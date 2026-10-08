import { baseApi } from "./baseApi";

export const favoriteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    toggleUserFavorite: builder.mutation({
      query: (body) => ({
        url: "/favorites/toggle",
        method: "POST",
        body, // contains { savedUserId }
      }),
      invalidatesTags: ["Favorite"],
    }),
    getMySavedUsers: builder.query({
      query: () => ({
        url: "/favorites/my-saved",
        method: "GET",
      }),
      providesTags: ["Favorite"],
    }),
    getMyClients: builder.query({
      query: () => ({
        url: "/favorites/my-clients",
        method: "GET",
      }),
      providesTags: ["Favorite"],
    }),
  }),
});

export const {
  useToggleUserFavoriteMutation,
  useGetMySavedUsersQuery,
  useGetMyClientsQuery,
} = favoriteApi;
