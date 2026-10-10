import { ConfigProvider, Modal, Table, Button, message, Spin, Pagination } from "antd";
import { useMemo, useState } from "react";
import { IoChevronBack, IoCheckmark, IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import {
  useGetAllVerifyProviderRequestsQuery,
  useInactiveToActiveMutation,
  useInactiveToRejectedMutation,
} from "../../redux/api/verifyProvider";

function VerifyRequest() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // API call to get all verify provider requests
  const {
    data: providersData,
    isLoading,
    refetch,
  } = useGetAllVerifyProviderRequestsQuery({
    page: currentPage,
    limit: pageSize,
  });

  const [updateStatus, { isLoading: isUpdating }] =
    useInactiveToActiveMutation();
  const [rejectStatus, { isLoading: isRejecting }] =
    useInactiveToRejectedMutation();

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedProvider(null);
  };

  const showViewModal = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  // Transform API data to table format
  const dataSource = useMemo(() => {
    return Array.isArray(providersData?.data?.data)
      ? providersData?.data?.data?.map((provider, index) => ({
          key: provider.id || index + 1,
          fullName: provider.fullName || "Unknown Provider",
          email: provider.email || "No email",
          phone: provider.contactNumber || "No phone",
          address: provider.address || "No address",
          country: provider.country || "No country",
          status: provider.status || "UNKNOWN",
          joined: provider.createdAt
            ? new Date(provider.createdAt).toLocaleDateString()
            : "Unknown",
          originalData: provider,
        }))
      : [];
  }, [providersData]);

  const columns = [
    {
      title: "No",
      key: "no",
      width: 70,
      render: (_, _r, index) => index + 1,
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (value, record) => (
        <div className="flex items-center gap-3">
          <img
            src={
              record.originalData?.profileImage ||
              `https://avatar.iran.liara.run/public/${record.key}`
            }
            className="w-10 h-10 object-cover rounded-full"
            alt="Provider Avatar"
            onError={(e) => {
              e.target.src = `https://avatar.iran.liara.run/public/${record.key}`;
            }}
          />
          <span className="leading-none">{value}</span>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone No", dataIndex: "phone", key: "phone" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Country", dataIndex: "country", key: "country" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : status === "INACTIVE"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    { title: "Joined Date", dataIndex: "joined", key: "joined" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <button className="" onClick={() => showViewModal(record)}>
            <FiEye className="text-blue-600 w-5 h-5 cursor-pointer rounded-md" />
          </button>
          <button
            className=""
            onClick={() => handleApprove(record)}
            disabled={isUpdating || isRejecting}
          >
            {isUpdating && updatingId === record.originalData?.id ? (
              <Spin size="small" className="text-green-600" />
            ) : (
              <IoCheckmark className="h-5 w-5 text-green-600 cursor-pointer rounded-md" />
            )}
          </button>
          <button
            className=""
            onClick={() => handleReject(record)}
            disabled={isUpdating || isRejecting}
          >
            {isRejecting && rejectingId === record.originalData?.id ? (
              <Spin size="small" className="text-red-600" />
            ) : (
              <IoClose className="h-5 w-5 text-red-600 cursor-pointer rounded-md" />
            )}
          </button>
        </div>
      ),
    },
  ];

  const handleApprove = async (record) => {
    if (!record?.originalData?.id) return;
    try {
      setUpdatingId(record.originalData.id);
      await updateStatus({
        id: record.originalData.id,
      }).unwrap();
      message.success("Provider approved successfully!");
      setIsModalOpen(false);
      setSelectedProvider(null);
      refetch();
    } catch (error) {
      console.error("Failed to approve provider:", error);
      message.error("Failed to approve provider. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (record) => {
    if (!record?.originalData?.id) return;
    try {
      setRejectingId(record.originalData.id);
      await rejectStatus({
        id: record.originalData.id,
      }).unwrap();
      message.success("Provider rejected successfully!");
      setIsModalOpen(false);
      setSelectedProvider(null);
      refetch();
    } catch (error) {
      console.error("Failed to reject provider:", error);
      message.error("Failed to reject provider. Please try again.");
    } finally {
      setRejectingId(null);
    }
  };

  // Pagination handlers
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  // Get pagination meta from API response
  const paginationMeta = providersData?.data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
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
          Verify Provider Requests
        </h1>
      </div>

      <ConfigProvider
        theme={{
          components: {
            InputNumber: {
              activeBorderColor: "#00c0b5",
            },
            Pagination: {
              colorPrimaryBorder: "#111827",
              colorBorder: "#111827",
              colorPrimaryHover: "#111827",
              colorTextPlaceholder: "#111827",
              itemActiveBgDisabled: "#111827",
              colorPrimary: "#111827",
            },
            Table: {
              headerBg: "blue-600",
              headerColor: "#000000",
              cellFontSize: 16,
              headerSplitColor: "blue-600",
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
            current={paginationMeta.page}
            total={paginationMeta.total}
            pageSize={paginationMeta.limit}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
            pageSizeOptions={["10", "20", "50", "100"]}
          />
        </div>
      </ConfigProvider>

      {/* View Modal */}
      <Modal
        title="Provider Details"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>,
          <Button
            key="approve"
            type="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleApprove(selectedProvider)}
            loading={isUpdating}
          >
            Approve
          </Button>,
          <Button
            key="reject"
            danger
            onClick={() => handleReject(selectedProvider)}
            loading={isRejecting}
          >
            Reject
          </Button>,
        ]}
        width={600}
      >
        {selectedProvider && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={
                  selectedProvider.originalData?.profileImage ||
                  `https://avatar.iran.liara.run/public/${selectedProvider.key}`
                }
                className="w-20 h-20 object-cover rounded-full"
                alt="Provider Avatar"
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedProvider.fullName}
                </h3>
                <p className="text-gray-600">{selectedProvider.email}</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                    selectedProvider.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : selectedProvider.status === "INACTIVE"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedProvider.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedProvider.phone || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedProvider.address || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedProvider.country || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Joined Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedProvider.joined}
                </p>
              </div>
            </div>

            {/* Passport/NID Documents Section */}
            {selectedProvider.originalData?.passportOrNID &&
              selectedProvider.originalData.passportOrNID.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Passport/NID Documents
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProvider.originalData.passportOrNID.map(
                      (doc, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-2"
                        >
                          <img
                            src={doc}
                            alt={`Document ${index + 1}`}
                            className="w-full h-48 object-cover rounded cursor-pointer"
                            onClick={() => window.open(doc, "_blank")}
                          />
                          <p className="text-xs text-gray-600 mt-1 text-center">
                            Document {index + 1}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VerifyRequest;
