import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
    }),
    registerServiceProvider: builder.mutation({
      query: (body) => ({
        url: "/users/service-provider",
        method: "POST",
        body,
      }),
    }),
    getMyProfile: builder.query({
      query: () => ({
        url: "/users/my-profile",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "/users/update",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    deleteMyAccount: builder.mutation({
      query: () => ({
        url: "/users/my-account",
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useRegisterServiceProviderMutation,
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useDeleteMyAccountMutation,
} = userApi;
