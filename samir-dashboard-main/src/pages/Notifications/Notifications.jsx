import { ConfigProvider, List, Button } from "antd";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import {
  useGetAllNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useMarkAsUnreadMutation,
} from "../../redux/api/notification";

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notificationsData, isLoading } = useGetAllNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markAsUnread] = useMarkAsUnreadMutation();

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Transform API data to component format
  const notificationsList = Array.isArray(notificationsData?.data)
    ? notificationsData.data
    : Array.isArray(notificationsData?.data?.data)
      ? notificationsData.data.data
      : [];

  const items =
    notificationsList.map((notif) => ({
      id: notif.id,
      title: notif.title,
      time: formatTimeAgo(notif.createdAt),
      read: notif.isRead !== undefined ? notif.isRead : notif.read,
      description: notif.message || notif.body,
    })) || [];

  const markRead = async (id, read = true) => {
    try {
      if (read) {
        await markAsRead(id).unwrap();
      } else {
        await markAsUnread(id).unwrap();
      }
    } catch (error) {
      console.error("Failed to mark notification:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="p-5 min-h-screen">
      <div className="bg-blue-600 px-4 md:px-5 py-3 rounded-md mb-3 flex flex-wrap md:flex-nowrap items-start md:items-center gap-2 md:gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl sm:text-2xl font-bold">
          Notifications
        </h1>
        <div className="ml-0 md:ml-auto w-full md:w-auto flex items-center justify-between md:justify-end gap-2 mt-2 md:mt-0">
          <Button onClick={markAllRead} size="small">
            Mark all read
          </Button>
        </div>
      </div>
      <ConfigProvider
        theme={{
          components: {
            List: {
              colorPrimary: "blue-600",
            },
          },
        }}
      >
        <div className="bg-transparent">
          <List
            split={false}
            loading={isLoading}
            dataSource={items}
            renderItem={(item) => (
              <div
                onClick={() => !item.read && markRead(item.id, true)}
                className={`group flex items-start justify-between gap-4 p-4 border border-gray-200 bg-white rounded-lg mb-3 transition hover:shadow-sm cursor-pointer ${
                  item.read ? "opacity-90" : ""
                }`}
              >
                {/* Unread Accent Bar */}
                <div
                  className={`w-1 rounded-full self-stretch ${
                    item.read ? "bg-transparent" : "bg-blue-600"
                  }`}
                />

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base md:text-lg font-semibold text-blue-600">
                      {item.title}
                    </h4>
                    <span className="text-xs md:text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full shrink-0">
                      {item.time}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-gray-600 text-sm mt-1 pr-2">
                      {item.description}
                    </p>
                  )}
                  {!item.read && (
                    <p className="text-[12px] text-blue-600 mt-1">New</p>
                  )}
                </div>

                {/* Actions (show on hover) */}
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.read ? (
                    <Button
                      size="small"
                      onClick={() => markRead(item.id, false)}
                    >
                      Mark unread
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      style={{ background: "blue-600" }}
                      onClick={() => markRead(item.id, true)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            )}
          />
          {items.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No notifications
            </div>
          )}
        </div>
      </ConfigProvider>
    </div>
  );
}
