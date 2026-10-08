import { baseApi } from "./baseApi";

export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSupportTickets: builder.query({
      query: () => ({
        url: "/reports",
        method: "GET",
      }),
      providesTags: ["Support"],
    }),
    createUserReport: builder.mutation({
      query: (body) => ({
        url: "/reports",
        method: "POST",
        body, // contains { message, subject, etc }
      }),
      invalidatesTags: ["Support"],
    }),
    getMySupportReports: builder.query({
      query: () => ({
        url: "/reports/my-report",
        method: "GET",
      }),
      providesTags: ["Support"],
    }),
    getSupportReportById: builder.query({
      query: (id) => ({
        url: `/reports/${id}`,
        method: "GET",
      }),
      providesTags: ["Support"],
    }),
    updateMySupportReport: builder.mutation({
      query: ({ supportId, body }) => ({
        url: `/reports/update-my-support/${supportId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Support"],
    }),
    deleteMySupportReport: builder.mutation({
      query: (supportId) => ({
        url: `/reports/delete-my-support/${supportId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Support"],
    }),
    deleteSupportTicket: builder.mutation({
      query: (supportId) => ({
        url: `/reports/${supportId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Support"],
    }),
  }),
});

export const {
  useGetAllSupportTicketsQuery,
  useCreateUserReportMutation,
  useGetMySupportReportsQuery,
  useGetSupportReportByIdQuery,
  useUpdateMySupportReportMutation,
  useDeleteMySupportReportMutation,
  useDeleteSupportTicketMutation,
} = supportApi;
