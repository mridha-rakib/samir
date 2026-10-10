import { baseApi } from "../baseUrl";

// auth api
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // login
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    // logout
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

    // get my profile
    getMyProfile: builder.query({
      query: () => ({
        url: "/users/my-profile",
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

    // update user(fullName, contactNumber, profileImage and country)
    updateUser: builder.mutation({
      query: (userData) => ({
        url: "/users/update",
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: userData,
        formData: true,
      }),
    }),

    // change password
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: "/auth/change-password",
        method: "PUT",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: passwordData,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useUpdateUserMutation,
  useGetMyProfileQuery,
  useChangePasswordMutation,
} = authApi;
