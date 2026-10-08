import { baseApi } from "./baseApi";

export const serviceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllServices: builder.query({
      query: (params) => ({
        url: "/services",
        method: "GET",
        params,
      }),
      providesTags: ["Service"],
    }),
    getMyServices: builder.query({
      query: () => ({
        url: "/services/my-services",
        method: "GET",
      }),
      providesTags: ["Service"],
    }),
    getServiceById: builder.query({
      query: (serviceId) => ({
        url: `/services/${serviceId}`,
        method: "GET",
      }),
      providesTags: ["Service"],
    }),
    createService: builder.mutation({
      query: (body) => ({
        url: "/services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Service"],
    }),
    updateService: builder.mutation({
      query: ({ serviceId, body }) => ({
        url: `/services/${serviceId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Service"],
    }),
    deleteService: builder.mutation({
      query: (serviceId) => ({
        url: `/services/${serviceId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Service"],
    }),
  }),
});

export const {
  useGetAllServicesQuery,
  useGetMyServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = serviceApi;
