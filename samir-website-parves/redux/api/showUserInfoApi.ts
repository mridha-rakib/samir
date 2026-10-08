import { baseApi } from "./baseApi";

export const showUserInfoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServiceProvidersForOwner: builder.query({
      query: (params) => ({
        url: "/show-user-info/service-providers-for-property-owner",
        method: "GET",
        params,
      }),
      providesTags: ["ShowUserInfo"],
    }),
  }),
});

export const {
  useGetServiceProvidersForOwnerQuery,
} = showUserInfoApi;
