import { baseApi } from "../baseUrl";

// dashboard api
export const dashboardTabApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get dashboard overview
    dashboardOverview: builder.query({
      query: (year) => ({
        url: `/statistics/overview?year=${year}`,
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
    }),
  }),
});

export const { useDashboardOverviewQuery } = dashboardTabApi;
