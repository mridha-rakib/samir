import { baseApi } from "../baseUrl";

// policy api
export const policyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // create / update privacy policy
    createPolicy: builder.mutation({
      query: (credentials) => ({
        url: "/policy",
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: credentials,
      }),
      invalidatesTags: ["Policy"],
    }),
    getPolicy: builder.query({
      query: () => ({
        url: "/policy",
        method: "GET",
      }),
      providesTags: ["Policy"],
    }),
  }),
});

export const { useCreatePolicyMutation, useGetPolicyQuery } = policyApi;
