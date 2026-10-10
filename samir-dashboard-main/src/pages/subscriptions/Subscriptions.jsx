import { ConfigProvider, Modal, Table, Select, Pagination } from "antd";
import { useState } from "react";
import { IoChevronBack, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useGetAllSubscriptionsQuery } from "../../redux/api/subscrition";

function Subscriptions() {
  const navigate = useNavigate();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [statusFilter, setStatusFilter] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Convert frontend status to backend status
  const getBackendStatus = (frontendStatus) => {
    switch (frontendStatus) {
      case "Active":
        return "ACTIVE";
      case "Expired":
        return "INACTIVE";
      case "Cancelled":
        return "CANCELED";
      default:
        return frontendStatus;
    }
  };

  // API call to get all subscriptions with filtering only
  const { data: subscriptionsData, isLoading } = useGetAllSubscriptionsQuery({
    status: statusFilter ? getBackendStatus(statusFilter) : undefined,
  });

  // Transform API data to table format
  console.log("subscriptionsData:", subscriptionsData);
  const allData = Array.isArray(subscriptionsData?.data?.data)
    ? subscriptionsData?.data?.data?.map((subscription) => {
        return {
          key: subscription.id,
          name: subscription.plan?.name || "Unknown Plan",
          user: subscription.user?.fullName || "Unknown User",
          status:
            subscription.status === "ACTIVE"
              ? "Active"
              : subscription.status === "CANCELED"
              ? "Cancelled"
              : "Expired",
          price: `${subscription.plan?.price?.currency || "$"}${
            subscription.plan?.price?.amount || 0
          }`,
          startDate: new Date(subscription.startDate).toLocaleDateString(),
          endDate: new Date(subscription.endDate).toLocaleDateString(),
          paymentMethod: "Credit Card", // Default since not in API response
          originalData: subscription,
        };
      })
    : Array.isArray(subscriptionsData?.data)
    ? subscriptionsData?.data?.map((subscription) => {
        return {
          key: subscription.id,
          name: subscription.plan?.name || "Unknown Plan",
          user: subscription.user?.fullName || "Unknown User",
          status:
            subscription.status === "ACTIVE"
              ? "Active"
              : subscription.status === "CANCELED"
              ? "Cancelled"
              : "Expired",
          price: `${subscription.plan?.price?.currency || "$"}${
            subscription.plan?.price?.amount || 0
          }`,
          startDate: new Date(subscription.startDate).toLocaleDateString(),
          endDate: new Date(subscription.endDate).toLocaleDateString(),
          paymentMethod: "Credit Card", // Default since not in API response
          originalData: subscription,
        };
      })
    : [];

  // Client-side filtering as fallback if backend doesn't filter
  const filteredData = statusFilter
    ? allData.filter((item) => item.status === statusFilter)
    : allData;

  // Client-side pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const dataSource = filteredData.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Calculate total items for pagination
  const totalItems = filteredData.length;

  const columns = [
    {
      title: "No",
      key: "no",
      width: 70,
      render: (_, _r, index) => index + 1,
    },
    {
      title: "Plan Name",
      dataIndex: "name",
      key: "name",
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "Active"
              ? "bg-green-100 text-green-800"
              : status === "Expired"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <button className="" onClick={() => showViewModal(record)}>
            <IoEyeOutline className="text-blue-600 w-5 h-5 cursor-pointer rounded-md" />
          </button>
        </div>
      ),
    },
  ];

  const showViewModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsViewModalOpen(true);
  };

  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setSelectedSubscription(null);
  };

  return (
    <div>
      <div className="bg-blue-600 px-4 md:px-5 py-3 rounded-md mb-3 flex flex-wrap md:flex-nowrap items-start md:items-center gap-2 md:gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl sm:text-2xl font-bold">
          Subscribers Management
        </h1>

        <div className="ml-0 md:ml-auto flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <Select
            placeholder="Filter by status"
            allowClear
            onChange={handleStatusFilterChange}
            className="w-full md:w-40"
            options={[
              { value: "Active", label: "Active" },
              { value: "Expired", label: "Expired" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
          />
        </div>
      </div>

      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: "#f9fafb",
              headerColor: "#000000",
              cellFontSize: 14,
              headerSplitColor: "#f9fafb",
              colorTextHeading: "#000000",
            },
          },
        }}
      >
        <Table
          dataSource={dataSource}
          columns={columns}
          loading={isLoading}
          pagination={false}
          scroll={{ x: "max-content" }}
          rowClassName="hover:bg-gray-50 cursor-pointer"
        />

        {/* Custom Pagination */}
        <div className="flex justify-end mt-4">
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>

        {/* View Subscriber Details Modal */}
        <Modal
          open={isViewModalOpen}
          centered
          onCancel={handleViewCancel}
          footer={null}
          width={800}
        >
          {selectedSubscription && (
            <div className="relative">
              {/* Header with blue gradient */}
              <div className="bg-blue-600 p-6 -m-6 mb-6 rounded-t-lg">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {selectedSubscription.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedSubscription.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : selectedSubscription.status === "Expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedSubscription.status}
                  </span>
                  <span className="text-white/90">
                    {selectedSubscription.user}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Plan Name</div>
                  <div className="text-lg font-semibold">
                    {selectedSubscription.name}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Price</div>
                  <div className="text-lg font-semibold">
                    {selectedSubscription.price}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Start Date</div>
                  <div className="text-lg font-semibold">
                    {selectedSubscription.startDate}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">End Date</div>
                  <div className="text-lg font-semibold">
                    {selectedSubscription.endDate}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Payment Method</div>
                  <div className="text-lg font-semibold">
                    {selectedSubscription.paymentMethod}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200 gap-3">
                <button
                  onClick={handleViewCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </ConfigProvider>
    </div>
  );
}

export default Subscriptions;
