import { baseApi } from "./baseApi";

export const statisticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverviewStats: builder.query({
      query: () => ({
        url: "/statistics/overview",
        method: "GET",
      }),
      providesTags: ["Statistics"],
    }),
    getPartnerTotalEarningsHotel: builder.query({
      query: (timeRange?: string) => ({
        url: `/statistics/earnings-hotel${timeRange ? `?timeRange=${timeRange}` : ""}`,
        method: "GET",
      }),
      providesTags: ["Statistics"],
    }),
    getServiceProviderTotalEarningsService: builder.query({
      query: (timeRange?: string) => ({
        url: `/statistics/earnings-service${timeRange ? `?timeRange=${timeRange}` : ""}`,
        method: "GET",
      }),
      providesTags: ["Statistics"],
    }),
    getAdminTotalEarnings: builder.query({
      query: () => ({
        url: "/statistics/admin-earnings",
        method: "GET",
      }),
      providesTags: ["Statistics"],
    }),
    getMyDashboardForPropertyOwner: builder.query({
      query: () => ({
        url: "/statistics/my-dashboard/property-owner",
        method: "GET",
      }),
      providesTags: ["Statistics"],
    }),
    getMyDashboardForServiceProvider: builder.query({
      query: () => ({
        url: "/statistics/my-dashboard/service-provider",
        method: "GET",
      }),
      providesTags: ["Statistics"],
    }),
  }),
});

export const {
  useGetOverviewStatsQuery,
  useGetPartnerTotalEarningsHotelQuery,
  useGetServiceProviderTotalEarningsServiceQuery,
  useGetAdminTotalEarningsQuery,
  useGetMyDashboardForPropertyOwnerQuery,
  useGetMyDashboardForServiceProviderQuery,
} = statisticsApi;
