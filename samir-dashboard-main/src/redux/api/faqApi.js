import { baseApi } from "../baseUrl";

export const faqApi = baseApi.injectEndpoints({
  tagTypes: ["FAQ"],
  endpoints: (builder) => ({
    // create FAQ
    createFaq: builder.mutation({
      query: (faqData) => ({
        url: "/faqs",
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: faqData,
      }),
      invalidatesTags: ["FAQ"],
    }),

    // get all FAQs
    getAllFaqs: builder.query({
      query: () => ({
        url: "/faqs",
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["FAQ"],
    }),

    // get single FAQ
    getSingleFaq: builder.query({
      query: (id) => ({
        url: `/faqs/${id}`,
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["FAQ"],
    }),

    // update FAQ
    updateFaq: builder.mutation({
      query: ({ id, ...faqData }) => ({
        url: `/faqs/${id}`,
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
        body: faqData,
      }),
      invalidatesTags: ["FAQ"],
    }),

    // delete FAQ
    deleteFaq: builder.mutation({
      query: (id) => ({
        url: `/faqs/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["FAQ"],
    }),
  }),
});

export const {
  useCreateFaqMutation,
  useGetAllFaqsQuery,
  useGetSingleFaqQuery,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = faqApi;
