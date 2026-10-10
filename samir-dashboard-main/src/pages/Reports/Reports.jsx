import { ConfigProvider, Modal, Table, message, Pagination } from "antd";
import { useState, useMemo } from "react";
import { IoChevronBack } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  useDeleteReportMutation,
  useGetAllReportsQuery,
} from "../../redux/api/reports";

function Reports() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // API call to get all reports
  const { data: reportsData, isLoading } = useGetAllReportsQuery({
    page: currentPage,
    limit: 10,
  });

  // Delete mutation
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();

  // transform API data to table format
  const dataSource = useMemo(() => {
    if (!reportsData?.data) return [];

    // Handle different response structures
    const reports = Array.isArray(reportsData.data)
      ? reportsData.data
      : reportsData.data.data || [];

    return reports.map((report, index) => ({
      key: report.id || String(index + 1),
      no: String(index + 1),
      reportFrom: report.user?.fullName || "Unknown User",
      reportReason: report.subject,
      reportTo: report.reportedUser?.fullName || "Unknown User",
      date: new Date(report.createdAt).toLocaleDateString(),
      user: report.user,
      reportedUser: report.reportedUser,
      type: report.supportType,
      description: report.description,
    }));
  }, [reportsData]);

  const showModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const showViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };
  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setSelectedUser(null);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Delete handler
  const handleDelete = async () => {
    if (selectedUser?.key) {
      try {
        await deleteReport(selectedUser.key).unwrap();
        message.success("Report deleted successfully!");
        setIsModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        message.error(error?.data?.message || "Failed to delete report");
      }
    }
  };

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
    },
    {
      title: "Report From",
      key: "reportFrom",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.user?.profileImage && (
            <img
              src={record.user.profileImage}
              className="w-10 h-10 object-cover rounded-full"
              alt="User Avatar"
            />
          )}
          <div className="flex flex-col gap-[2px]">
            <span className="leading-none">{record.reportFrom}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reportReason",
      key: "reportReason",
    },
    {
      title: "Reported To",
      key: "reportTo",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.reportedUser?.profileImage && (
            <img
              src={record.reportedUser.profileImage}
              className="w-10 h-10 object-cover rounded-full"
              alt="User Avatar"
            />
          )}
          <div className="flex flex-col gap-[2px]">
            <span className="leading-none">{record.reportTo}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          {/* <button className="" onClick={() => navigate("/chat")}>
            <LuMessageSquareText className=" w-5 h-5 cursor-pointer rounded-md" />
          </button> */}

          <button className="" onClick={() => showViewModal(record)}>
            <FaRegEye className="text-[#111827] w-5 h-5 cursor-pointer rounded-md" />
          </button>
          <button className="" onClick={() => showModal(record)}>
            <RiDeleteBin6Line className="text-red-500 w-5 h-5 cursor-pointer rounded-md" />
          </button>
        </div>
      ),
    },
  ];
  return (
    <div>
      <div className="bg-[#2563eb] px-5 py-3 rounded-md mb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl font-bold">Reports</h1>
      </div>

      <ConfigProvider
        theme={{
          components: {
            InputNumber: {
              activeBorderColor: "#6BB43A",
            },
            Pagination: {
              colorPrimaryBorder: "#2563eb",
              colorBorder: "#2563eb",
              colorPrimaryHover: "#2563eb",
              colorTextPlaceholder: "#2563eb",
              itemActiveBgDisabled: "#2563eb",
              colorPrimary: "#2563eb",
            },
            Table: {
              headerBg: "white",
              headerColor: "black",
              cellFontSize: 16,
              headerSplitColor: "white",
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
        />

        {/* Custom Pagination */}
        {reportsData?.data?.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              current={currentPage}
              total={reportsData.data.total || 0}
              pageSize={10}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
            />
          </div>
        )}
        {/* Delete Modal */}
        <Modal
          open={isModalOpen}
          centered
          onCancel={handleCancel}
          footer={null}
        >
          <div className="flex flex-col justify-center items-center py-10">
            <h1 className="text-3xl text-center text-[#111827]">
              Are you sure!
            </h1>
            <p className="text-xl text-center mt-5">
              Do you want to delete this report?
            </p>
            <div className="text-center py-5 w-full">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold w-1/3 py-3 px-5 rounded-lg transition-colors cursor-pointer"
              >
                {isDeleting ? "DELETING..." : "CONFIRM"}
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
          className="report-view-modal"
        >
          {selectedUser && (
            <div className="relative">
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-[#2563eb] to-[#2563eb] p-6 -m-6 mb-6 rounded-t-lg">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={selectedUser.reportedUser?.profileImage || `https://ui-avatars.com/api/?name=${selectedUser.reportTo}&background=random`}
                      alt={selectedUser.reportTo}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white bg-red-500">
                      REPORT
                    </div>
                  </div>
                  <div className="text-white">
                    <h2 className="text-3xl font-bold mb-2">
                      Report #{selectedUser.no.padStart(4, "0")}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        Report From: {selectedUser.reportFrom}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        Report To: {selectedUser.reportTo}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        Date: {selectedUser.date}
                      </span>
                    </div>
                    <p className="text-white/90">Status: Under Review</p>
                  </div>
                </div>
              </div>

              {/* Content sections */}
              <div className="space-y-6">
                {/* Report Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 text-[#111827]">
                    <div className="w-2 h-2 bg-[#6BB43A] rounded-full"></div>
                    Report Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-lg">⚠️</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 text-[#111827]">
                            Reason
                          </h4>
                          <p className="text-lg font-semibold text-gray-800">
                            {selectedUser.reportReason}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 text-lg">📋</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600">
                            Report Type
                          </h4>
                          <p className="text-lg font-semibold text-gray-800">
                            {selectedUser.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reporter & Additional Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#6BB43A] rounded-full"></div>
                    Participants
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-lg">👤</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600">
                            Report From
                          </h4>
                          <p className="text-lg font-semibold text-gray-800">
                            {selectedUser.reportFrom}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-lg">📩</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600">
                            Report To
                          </h4>
                          <p className="text-lg font-semibold text-gray-800">
                            {selectedUser.reportTo}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#6BB43A] rounded-full"></div>
                    Report Description
                  </h3>
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Report Details:</strong>{" "}
                      {selectedUser.reportReason}
                      <br />
                      <br />
                      <strong>Location:</strong> This incident was reported to
                      the {selectedUser.reportTo}.
                      <br />
                      <br />
                      <strong>Category:</strong> This report has been classified
                      as &quot;{selectedUser.type}&quot;. Further investigation
                      is required to determine the appropriate action.
                    </p>
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

export default Reports;
