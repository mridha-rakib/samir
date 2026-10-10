import { baseApi } from "../baseUrl";

export const verifyProviderApi = baseApi.injectEndpoints({
  tagTypes: ["Provider"],
  endpoints: (builder) => ({
    // get all verify provider requests
    getAllVerifyProviderRequests: builder.query({
      query: ({ page = 1, limit = 10 }) => {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        return {
          url: `/users/inactive/service-providers?${queryParams.toString()}`,
          method: "GET",
          headers: {
            Authorization: `${localStorage.getItem("accessToken")}`,
          },
        };
      },
      providesTags: ["Provider"],
    }),

    // update status (inactive to active)
    inactiveToActive: builder.mutation({
      query: ({ id }) => ({
        url: `/users/update-user-status-active/${id}`,
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        // body: { status: "active" },
      }),
      invalidatesTags: ["Provider"],
    }),

    // update status (inactive to rejected)
    inactiveToRejected: builder.mutation({
      query: ({ id }) => ({
        url: `/users/update-user-status-rejected/${id}`,
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        // body: { status: "active" },
      }),
      invalidatesTags: ["Provider"],
    }),
  }),
});

export const {
  useGetAllVerifyProviderRequestsQuery,
  useInactiveToActiveMutation,
  useInactiveToRejectedMutation,
} = verifyProviderApi;
