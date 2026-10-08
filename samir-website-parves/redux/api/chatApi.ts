import { baseApi } from "./baseApi";

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserChannels: builder.query({
      query: () => ({
        url: "/messages/channels",
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
    getMyChannels: builder.query({
      query: (params?: { page?: number; limit?: number; searchTerm?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
        const queryString = queryParams.toString();
        return {
          url: `/messages/my-channels-by-authorization-token${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Chat"],
    }),
    getChannelMessages: builder.query({
      query: ({ channelId, page = 1, limit = 30 }: { channelId: string; page?: number; limit?: number }) => ({
        url: `/messages/channel-messages/${channelId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
    getMyChannel: builder.query({
      query: (receiverId) => ({
        url: `/messages/my-channel/${receiverId}`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
    sendMessage: builder.mutation({
      query: ({ receiverId, body }) => ({
        url: `/messages/send-message/${receiverId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const {
  useGetUserChannelsQuery,
  useGetMyChannelsQuery,
  useGetChannelMessagesQuery,
  useGetMyChannelQuery,
  useSendMessageMutation,
} = chatApi;
