import { baseApi } from "./baseApi";

export const phoneApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation({
      query: (body) => ({
        url: "/phone/send-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Phone"],
    }),
    verifyPhoneOtp: builder.mutation({
      query: (body) => ({
        url: "/phone/verify-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Phone", "User"],
    }),
  }),
});

export const {
  useSendOtpMutation,
  useVerifyPhoneOtpMutation,
} = phoneApi;
