import { baseApi } from "./baseApi";

export const policyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrUpdatePrivacyPolicy: builder.mutation({
      query: (body) => ({
        url: "/policy",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Policy"],
    }),
    getAllPrivacyPolicy: builder.query({
      query: () => ({
        url: "/policy",
        method: "GET",
      }),
      providesTags: ["Policy"],
    }),
    getTermsConditions: builder.query({
      query: () => ({
        url: "/terms-conditions",
        method: "GET",
      }),
      providesTags: ["Policy"],
    }),
    createOrUpdateTermsConditions: builder.mutation({
      query: (body) => ({
        url: "/terms-conditions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Policy"],
    }),
  }),
});

export const {
  useCreateOrUpdatePrivacyPolicyMutation,
  useGetAllPrivacyPolicyQuery,
  useGetTermsConditionsQuery,
  useCreateOrUpdateTermsConditionsMutation,
} = policyApi;
