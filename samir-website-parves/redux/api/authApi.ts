import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body, // contains { otp }
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, body }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body, // contains { password, confirmPassword }
        headers: {
          authorization: token,
        },
      }),
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: "/auth/change-password",
        method: "PUT",
        body, // contains { oldPassword, newPassword }
      }),
    }),
    verifyRegistrationOtp: builder.mutation({
      query: (body) => ({
        url: "/users/verify-user",
        method: "POST",
        body, // contains { email, otp }
      }),
    }),
    getAirbnbStatus: builder.query({
      query: () => ({
        url: "/auth/airbnb/status",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),
    disconnectAirbnb: builder.mutation({
      query: () => ({
        url: "/auth/airbnb/disconnect",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyRegistrationOtpMutation,
  useGetAirbnbStatusQuery,
  useDisconnectAirbnbMutation,
} = authApi;
