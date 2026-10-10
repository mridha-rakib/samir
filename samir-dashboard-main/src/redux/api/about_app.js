import { baseApi } from "../baseUrl";

// about api
export const aboutAppApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // create / update about app
    aboutAppPolicy: builder.mutation({
      query: (credentials) => ({
        url: "/settings/about",
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: credentials,
      }),
      invalidatesTags: ["AboutApp"],
    }),
    getAboutAppPolicy: builder.query({
      query: () => ({
        url: "/settings/about",
        method: "GET",
      }),
      providesTags: ["AboutApp"],
    }),
  }),
});

export const { useAboutAppPolicyMutation, useGetAboutAppPolicyQuery } = aboutAppApi;
