import { baseApi } from "../baseUrl";

// notification api
export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all notifications
    getAllNotifications: builder.query({
      query: () => ({
        url: "/notifications/all-notifications",
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Notification"],
    }),

    // mark notification as unread
    markAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/mark-as-read/${notificationId}`,
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Notification"],
    }),

    // mark notification as unread
    markAsUnread: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/mark-as-unread/${notificationId}`,
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Notification"],
    }),

    // mark all notification as read
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/mark-all-as-read",
        method: "PATCH",
        headers: {
          Authorization: `${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const { 
  useGetAllNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation, 
  useMarkAsUnreadMutation 
} = notificationApi;
