import { baseApi } from "../baseUrl";

// admin api
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all admins
    getAllAdmins: builder.query({
      query: () => ({
        url: "/users/admins",
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Admin"],
    }),

    // create admin
    createAdmin: builder.mutation({
      query: (credentials) => ({
        url: "/users/add-role",
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: credentials,
      }),
      invalidatesTags: ["Admin"],
    }),
  }),
});

export const { useCreateAdminMutation, useGetAllAdminsQuery } = adminApi;
