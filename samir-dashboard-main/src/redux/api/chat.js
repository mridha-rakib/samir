import { baseApi } from "../baseUrl";

export const adminChannelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // admin channels
    getAllChannelsForAdmin: builder.query({
      query: () => ({
        url: `/messages/channels`,
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["AdminChannels"],
    }),

    // get all message by the channel name
    getAllMessageByChannelName: builder.query({
      query: ({ channelName, page = 1, limit = 20 }) => ({
        url: `/messages/get-message/${channelName}?page=${page}&limit=${limit}`,
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["AdminChannels"],
    }),
  }),
});

export const {
  useGetAllChannelsForAdminQuery,
  useGetAllMessageByChannelNameQuery,
} = adminChannelsApi;
