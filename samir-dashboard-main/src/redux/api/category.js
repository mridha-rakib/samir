import { baseApi } from "../baseUrl";

// category api - injected into baseApi
export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all sports type categories
    getAllSportsTypeCategories: builder.query({
      query: () => ({
        url: "/sports-types",
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Category"],
    }),

    // create sports type category
    createSportsTypeCategory: builder.mutation({
      query: (credentials) => ({
        url: "/sports-types",
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: credentials,
      }),
      invalidatesTags: ["Category"],
    }),

    // update sports type category
    updateSportsTypeCategory: builder.mutation({
      query: ({ id, credentials }) => ({
        url: `/sports-types/${id}`,
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: credentials,
      }),
      invalidatesTags: ["Category"],
    }),

    // delete sports type category
    deleteSportsTypeCategory: builder.mutation({
      query: (id) => ({
        url: `/sports-types/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useCreateSportsTypeCategoryMutation,
  useGetAllSportsTypeCategoriesQuery,
  useUpdateSportsTypeCategoryMutation,
  useDeleteSportsTypeCategoryMutation,
} = categoryApi;
