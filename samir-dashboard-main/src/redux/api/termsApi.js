import { baseApi } from "../baseUrl";

// terms api
export const termsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // create / update terms and condition
    createTermsAndCondition: builder.mutation({
      query: (credentials) => ({
        url: "/terms-conditions",
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: credentials,
      }),
      invalidatesTags: ["Terms"],
    }),
    getTermsAndCondition: builder.query({
      query: () => ({
        url: "/terms-conditions",
        method: "GET",
      }),
      providesTags: ["Terms"],
    }),
  }),
});

export const { useCreateTermsAndConditionMutation, useGetTermsAndConditionQuery } = termsApi;
