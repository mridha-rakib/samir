import { baseApi } from "../baseUrl";

export const earnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get admin earns
    adminEarns: builder.query({
      query: (timeRange) => ({
        url: `/statistics/admin-earnings?timeRange=${timeRange}`,
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
    }),
  }),
});

export const { useAdminEarnsQuery } = earnApi;
