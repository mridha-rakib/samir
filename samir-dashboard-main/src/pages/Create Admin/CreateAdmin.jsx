import { ConfigProvider, Table } from "antd";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { IoChevronBack, IoAddOutline } from "react-icons/io5";
import { useGetAllAdminsQuery } from "../../redux/api/admin";

export default function CreateAdmin() {
  const navigate = useNavigate();

  // API call to get all admins
  const { data: adminsData, isLoading} = useGetAllAdminsQuery();

  // Transform API data to table format
  const dataSource = useMemo(() => {
    if (!adminsData) return [];

    // Handle different response structures
    const admins = Array.isArray(adminsData)
      ? adminsData
      : adminsData?.data || adminsData?.admins || [];

    return admins.map((admin, index) => ({
      key: admin.id || String(index + 1),
      no: String(index + 1),
      name: admin.fullName || admin.name || "Unknown",
      email: admin.email || "No email",
      password: "********",
      designation: admin.role || "Admin",
    }));
  }, [adminsData]);


  const columns = [
    { title: "No", dataIndex: "no", key: "no" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Password", dataIndex: "password", key: "password" },
    { title: "Designation", dataIndex: "designation", key: "designation" },
  ];

  return (
    <div className="p-5">
      <div className="bg-blue-600 px-5 py-3 rounded-md mb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl font-bold">Create Admin</h1>
        <button
          type="button"
          onClick={() => navigate("/add-admin")}
          className="ml-auto bg-white text-blue-600 px-3 py-1 rounded-md font-semibold flex items-center gap-2 hover:opacity-95 transition cursor-pointer"
        >
          <IoAddOutline className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: "blue-600",
              headerColor: "blue-600",
              cellFontSize: 16,
              headerSplitColor: "blue-600",
            },
            Pagination: {
              colorPrimaryBorder: "blue-600",
              colorBorder: "blue-600",
              colorPrimaryHover: "blue-600",
              colorTextPlaceholder: "blue-600",
              itemActiveBgDisabled: "blue-600",
              colorPrimary: "blue-600",
            },
          },
        }}
      >
        <Table
          dataSource={dataSource}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </ConfigProvider>
    </div>
  );
}
