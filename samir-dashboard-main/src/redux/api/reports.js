import { baseApi } from "../baseUrl";

// reports api
export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all reports
    getAllReports: builder.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/reports?page=${page}&limit=${limit}`,
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Reports"],
    }),
    
    // delete report
    deleteReport: builder.mutation({
      query: (id) => ({
        url: `/reports/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Reports"],
    }),
  }),
});

export const { useGetAllReportsQuery, useDeleteReportMutation } = reportsApi;
