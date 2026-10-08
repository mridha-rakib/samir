import { baseApi } from "./baseApi";

export const faqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createFaq: builder.mutation({
      query: (body) => ({
        url: "/faqs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Faq"],
    }),
    getAllFaq: builder.query({
      query: () => ({
        url: "/faqs",
        method: "GET",
      }),
      providesTags: ["Faq"],
    }),
    getSingleFaq: builder.query({
      query: (id) => ({
        url: `/faqs/${id}`,
        method: "GET",
      }),
      providesTags: ["Faq"],
    }),
    updateFaq: builder.mutation({
      query: ({ id, body }) => ({
        url: `/faqs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Faq"],
    }),
    deleteFaq: builder.mutation({
      query: (id) => ({
        url: `/faqs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Faq"],
    }),
  }),
});

export const {
  useCreateFaqMutation,
  useGetAllFaqQuery,
  useGetSingleFaqQuery,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = faqApi;
