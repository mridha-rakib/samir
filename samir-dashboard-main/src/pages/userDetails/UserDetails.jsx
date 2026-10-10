import { ConfigProvider, Modal, Table, Pagination, Select } from "antd";
import { useMemo, useState, useEffect } from "react";
import { IoSearch, IoChevronBack } from "react-icons/io5";
import { MdBlock } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import {
  useGetAllUsersPaginatedQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
} from "../../redux/api/userManagement";
function UserDetails() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); // block modal
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false); // unblock modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page when searching
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when role changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole]);

  // API call to get all users with pagination and search
  const { data: usersData, isLoading, refetch } = useGetAllUsersPaginatedQuery({
    page: currentPage,
    limit: pageSize,
    ...(debouncedSearch && { searchTerm: debouncedSearch }),
    ...(selectedRole && { role: selectedRole }),
  });
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();
  const handleCancel = () => {
    setIsModalOpen(false);
    setIsUnblockModalOpen(false);
  };

  const showViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };
  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setSelectedUser(null);
  };
  // Transform API data to table format
  const dataSource = useMemo(() => {
    return Array.isArray(usersData?.data?.data)
      ? usersData?.data?.data?.map((user, index) => ({
          key: user.id || index + 1,
          fullName: user.fullName || user.name || "Unknown User",
          role: user.role || "User",
          clinic: user.clinic || "Not specified",
          email: user.email || "No email",
          phone: user.contactNumber || user.phone || "No phone",
          status: user.status || "UNKNOWN",
          joined: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "Unknown",
          originalData: user,
        }))
      : [];
  }, [usersData]);
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
            alt="User Avatar"
            onError={(e) => {
              e.target.src = `https://avatar.iran.liara.run/public/${record.key}`;
            }}
          />
          <span className="leading-none">{value}</span>
        </div>
      ),
    },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone No", dataIndex: "phone", key: "phone" },
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
                ? "bg-red-100 text-red-800"
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
          {/* Block button shown when user is ACTIVE */}
          {record.status === "ACTIVE" && (
            <button
              className=""
              onClick={() => openBlock(record)}
              disabled={isBlocking}
            >
              <MdBlock className="h-5 w-5 text-red-600 cursor-pointer rounded-md" />
            </button>
          )}
          {/* Unblock button shown when user is INACTIVE */}
          {record.status === "INACTIVE" && (
            <button
              className=""
              onClick={() => openUnblock(record)}
              disabled={isUnblocking}
            >
              <MdBlock className="h-5 w-5 text-green-600 cursor-pointer rounded-md" />
            </button>
          )}
          <button className="" onClick={() => showViewModal(record)}>
            <FiEye className="text-blue-600 w-5 h-5 cursor-pointer rounded-md" />
          </button>
        </div>
      ),
    },
  ];

  const openBlock = (row) => {
    setSelectedUser(row);
    setIsModalOpen(true);
  };

  const openUnblock = (row) => {
    setSelectedUser(row);
    setIsUnblockModalOpen(true);
  };

  // Pagination handlers
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  };

  // Get pagination meta from API response
  const paginationMeta = usersData?.data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
  };

  const confirmBlock = async () => {
    try {
      await blockUser(selectedUser.originalData.id).unwrap();
      setIsModalOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error("Failed to block user:", error);
    }
  };

  const confirmUnblock = async () => {
    try {
      await unblockUser(selectedUser.originalData.id).unwrap();
      setIsUnblockModalOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error("Failed to unblock user:", error);
    }
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
          User Management
        </h1>
        {/* Mobile search */}
        <div className="relative w-full md:hidden mt-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white text-[#0D0D0D] placeholder-gray-500 pl-10 pr-3 py-2 rounded-md focus:outline-none mb-2"
          />
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Select
            placeholder="Filter by Role"
            value={selectedRole}
            onChange={setSelectedRole}
            allowClear
            className="w-full mt-2"
            options={[
              { value: "USER", label: "User" },
              { value: "PROPERTY_OWNER", label: "Property Owner" },
              { value: "SERVICE_PROVIDER", label: "Service Provider" },
            ]}
          />
        </div>
        <div className="ml-0 md:ml-auto flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <div className="relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="bg-white text-[#0D0D0D] placeholder-[#111827] pl-10 pr-3 py-2 rounded-md focus:outline-none"
            />
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111827]" />
          </div>
          <Select
            placeholder="Filter by Role"
            value={selectedRole}
            onChange={setSelectedRole}
            allowClear
            className="w-40"
            options={[
              { value: "USER", label: "User" },
              { value: "PROPERTY_OWNER", label: "Property Owner" },
              { value: "SERVICE_PROVIDER", label: "Service Provider" },
            ]}
          />
        </div>
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
              headerColor: "#000000", // Changed to black
              cellFontSize: 16,
              headerSplitColor: "blue-600",
              colorTextHeading: "#000000", // Ensure header text is black
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
            onShowSizeChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
        {/* Block Modal */}
        <Modal
          open={isModalOpen}
          centered
          onCancel={handleCancel}
          footer={null}
          style={{ top: 0 }}
          bodyStyle={{ padding: 0, overflowY: 'auto' }}
        >
          <div className="flex flex-col justify-center items-center py-10">
            <h1 className="text-3xl text-center text-[#111827]">Deactivate User</h1>
            <p className="text-xl text-center mt-5">
              {selectedUser
                ? `Do you want to deactivate ${selectedUser.fullName}?`
                : `Do you want to deactivate this user?`}
            </p>
            <div className="text-center py-5 w-full flex justify-center gap-3">
              <button
                onClick={handleCancel}
                className="bg-gray-800 text-white font-semibold py-3 px-5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlock}
                className="bg-red-600 text-white font-semibold py-3 px-5 rounded-lg cursor-pointer"
                disabled={isBlocking}
              >
                {isBlocking ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Unblock Modal */}
        <Modal
          open={isUnblockModalOpen}
          centered
          onCancel={handleCancel}
          footer={null}
          style={{ top: 0 }}
          bodyStyle={{ padding: 0, overflowY: 'auto' }}
        >
          <div className="flex flex-col justify-center items-center py-10">
            <h1 className="text-3xl text-center text-[#111827]">Active User</h1>
            <p className="text-xl text-center mt-5">
              {selectedUser
                ? `Do you want to activate ${selectedUser.fullName}?`
                : `Do you want to activate this user?`}
            </p>
            <div className="text-center py-5 w-full flex justify-center gap-3">
              <button
                onClick={handleCancel}
                className="bg-gray-800 text-white font-semibold py-3 px-5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnblock}
                className="bg-green-600 text-white font-semibold py-3 px-5 rounded-lg cursor-pointer"
                disabled={isUnblocking}
              >
                {isUnblocking ? "Activating..." : "Activate"}
              </button>
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal
          open={isViewModalOpen}
          centered
          onCancel={handleViewCancel}
          footer={null}
          width={800}
          className="user-view-modal"
          style={{ top: 0 }}
          bodyStyle={{ padding: 0, overflowY: 'auto' }}
        >
          {selectedUser && (
            <div className="relative">
              {/* Header with green gradient */}
              <div className="bg-blue-600 p-6 -m-6 mb-6 rounded-t-lg">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <img
                      src={
                        selectedUser.originalData?.profileImage ||
                        `https://avatar.iran.liara.run/public/${selectedUser.key}`
                      }
                      alt={selectedUser.fullName}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover mx-auto"
                      onError={(e) => {
                        e.target.src = `https://avatar.iran.liara.run/public/${selectedUser.key}`;
                      }}
                    />
                  </div>
                  <div className="text-white overflow-hidden w-full">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                      {selectedUser.fullName}
                    </h2>
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-1">
                      {/* <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        {selectedUser.clinic}
                      </span> */}
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                        Joined: {selectedUser.joined}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm overflow-hidden">
                  <div className="text-black text-sm">Email</div>
                  <div className="text-base sm:text-lg font-semibold break-all">
                    {selectedUser.email}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm overflow-hidden">
                  <div className="text-black text-sm">Phone No</div>
                  <div className="text-base sm:text-lg font-semibold break-words">
                    {selectedUser.phone}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-black text-sm">Status</div>
                  <div className="text-lg font-semibold">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedUser.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : selectedUser.status === "INACTIVE"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-black text-sm">Joined Date</div>
                  <div className="text-lg font-semibold">
                    {selectedUser.joined}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleViewCancel}
                  className="bg-blue-600 text-white font-semibold px-8 py-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
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

export default UserDetails;
